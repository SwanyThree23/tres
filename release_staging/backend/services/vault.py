"""SwanyThree Vault Pro -- AES-256-GCM encryption service for secrets at rest.

Provides symmetric encryption for stream keys, API tokens, and any other
sensitive data that must be persisted.  Keys are derived from a single master
password using PBKDF2-HMAC-SHA256 (100 000 iterations).

Usage::

    from services.vault import vault

    token  = vault.encrypt("my-secret")
    secret = vault.decrypt(token)

    sealed = vault.seal_stream_key("twitch", "rtmp://...", "live_xxx")
    creds  = vault.unseal_stream_key(sealed)
"""

from __future__ import annotations

import base64
import json
import logging
import os
from typing import Any, Dict

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

logger = logging.getLogger(__name__)


class VaultPro:
    """AES-256-GCM encryption service using PBKDF2-derived keys.

    The master key is stretched into a 256-bit key via PBKDF2 with a fixed
    application-level salt and 100 000 iterations.  Each ``encrypt`` call
    generates a fresh 96-bit random nonce so identical plaintexts always
    produce different ciphertext.
    """

    NONCE_SIZE: int = 12          # 96 bits -- recommended for AES-GCM
    SALT: bytes = b"swanythree-vault-pro-v2"
    ITERATIONS: int = 100_000
    KEY_LENGTH: int = 32          # 256 bits

    # ------------------------------------------------------------------
    # Construction
    # ------------------------------------------------------------------

    def __init__(self, master_key: str | None = None) -> None:
        """Initialise Vault Pro with a master key.

        Args:
            master_key: Master encryption key.  Falls back to the
                ``VAULT_MASTER_KEY`` environment variable when *None*.

        Raises:
            ValueError: If the resolved master key is missing or shorter
                than 16 characters.
        """
        resolved_key = master_key or os.environ.get("VAULT_MASTER_KEY", "")

        if not resolved_key:
            raise ValueError(
                "VaultPro requires a master key. Supply it as a constructor "
                "argument or set the VAULT_MASTER_KEY environment variable."
            )

        if len(resolved_key) < 16:
            raise ValueError(
                f"Master key must be at least 16 characters (got {len(resolved_key)})."
            )

        derived = self._derive_key(resolved_key)
        self._aesgcm = AESGCM(derived)
        logger.info("VaultPro initialised successfully.")

    # ------------------------------------------------------------------
    # Key derivation
    # ------------------------------------------------------------------

    def _derive_key(self, master_key: str) -> bytes:
        """Derive a 256-bit encryption key from *master_key* using PBKDF2.

        Args:
            master_key: The human-readable master password.

        Returns:
            32-byte derived key suitable for AES-256.
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=self.KEY_LENGTH,
            salt=self.SALT,
            iterations=self.ITERATIONS,
        )
        return kdf.derive(master_key.encode("utf-8"))

    # ------------------------------------------------------------------
    # Core encrypt / decrypt
    # ------------------------------------------------------------------

    def encrypt(self, plaintext: str) -> str:
        """Encrypt a plaintext string.

        Args:
            plaintext: The string to encrypt.

        Returns:
            A URL-safe Base64 string containing ``nonce || ciphertext || tag``.

        Raises:
            ValueError: If *plaintext* is not a string.
        """
        if not isinstance(plaintext, str):
            raise ValueError("encrypt() expects a str argument.")

        nonce = os.urandom(self.NONCE_SIZE)
        ciphertext_with_tag: bytes = self._aesgcm.encrypt(
            nonce,
            plaintext.encode("utf-8"),
            None,  # no additional authenticated data
        )
        # Concatenate nonce + ciphertext+tag and encode as URL-safe Base64.
        raw = nonce + ciphertext_with_tag
        return base64.urlsafe_b64encode(raw).decode("ascii")

    def decrypt(self, token: str) -> str:
        """Decrypt a Vault Pro token back to plaintext.

        Args:
            token: URL-safe Base64-encoded encrypted token produced by
                :meth:`encrypt`.

        Returns:
            The original plaintext string.

        Raises:
            ValueError: If the token is malformed, too short, or the
                authentication tag does not verify.
        """
        try:
            raw = base64.urlsafe_b64decode(token)
        except Exception as exc:
            raise ValueError(f"Invalid base64 token: {exc}") from exc

        if len(raw) <= self.NONCE_SIZE:
            raise ValueError(
                "Token is too short to contain a valid nonce + ciphertext."
            )

        nonce = raw[: self.NONCE_SIZE]
        ciphertext_with_tag = raw[self.NONCE_SIZE :]

        try:
            plaintext_bytes: bytes = self._aesgcm.decrypt(
                nonce,
                ciphertext_with_tag,
                None,
            )
        except Exception as exc:
            raise ValueError(f"Decryption failed (bad key or corrupted data): {exc}") from exc

        return plaintext_bytes.decode("utf-8")

    # ------------------------------------------------------------------
    # JSON helpers
    # ------------------------------------------------------------------

    def encrypt_json(self, data: dict) -> str:
        """Encrypt a dictionary by serialising it to JSON first.

        Args:
            data: JSON-serialisable dictionary.

        Returns:
            Encrypted token string.

        Raises:
            TypeError: If *data* cannot be serialised to JSON.
        """
        try:
            payload = json.dumps(data, separators=(",", ":"), sort_keys=True)
        except (TypeError, ValueError) as exc:
            raise TypeError(f"Data is not JSON-serialisable: {exc}") from exc
        return self.encrypt(payload)

    def decrypt_json(self, token: str) -> dict:
        """Decrypt a token and deserialise the JSON payload.

        Args:
            token: Encrypted token produced by :meth:`encrypt_json`.

        Returns:
            The original dictionary.

        Raises:
            ValueError: If decryption or JSON parsing fails.
        """
        plaintext = self.decrypt(token)
        try:
            data = json.loads(plaintext)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Decrypted payload is not valid JSON: {exc}") from exc
        if not isinstance(data, dict):
            raise ValueError("Decrypted JSON is not a dictionary.")
        return data

    # ------------------------------------------------------------------
    # Stream-key convenience methods
    # ------------------------------------------------------------------

    def seal_stream_key(self, platform: str, rtmp_url: str, stream_key: str) -> str:
        """Encrypt streaming credentials for secure storage.

        Args:
            platform:   Streaming platform name (e.g. ``"twitch"``).
            rtmp_url:   RTMP ingest URL.
            stream_key: Secret stream key.

        Returns:
            Encrypted token containing all three fields.
        """
        return self.encrypt_json(
            {
                "platform": platform,
                "rtmp_url": rtmp_url,
                "stream_key": stream_key,
            }
        )

    def unseal_stream_key(self, token: str) -> Dict[str, Any]:
        """Decrypt streaming credentials.

        Args:
            token: Token produced by :meth:`seal_stream_key`.

        Returns:
            Dictionary with ``platform``, ``rtmp_url``, and ``stream_key``.
        """
        return self.decrypt_json(token)


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
# We attempt to create the singleton from the environment at import time.
# If the key is not set, we log a warning and set ``vault`` to *None* so that
# the rest of the application can still import the module without crashing.
# Any code that actually *uses* the vault should check for *None* or let the
# AttributeError surface clearly.
# ---------------------------------------------------------------------------

vault: VaultPro | None = None

try:
    vault = VaultPro()
except (ValueError, KeyError) as _init_err:
    logger.warning(
        "VaultPro singleton not initialised: %s  "
        "Set VAULT_MASTER_KEY to enable encryption.",
        _init_err,
    )
