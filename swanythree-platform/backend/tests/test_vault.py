"""Tests for Vault Pro encryption service."""

import pytest
from services.vault import VaultPro


@pytest.fixture
def vault():
    return VaultPro("test-master-key-minimum-16-chars")


def test_encrypt_decrypt_roundtrip(vault):
    plaintext = "Hello, SwanyThree!"
    encrypted = vault.encrypt(plaintext)
    assert encrypted != plaintext
    decrypted = vault.decrypt(encrypted)
    assert decrypted == plaintext


def test_encrypt_json_roundtrip(vault):
    data = {"platform": "twitch", "key": "live_abc123", "url": "rtmp://a.rtmp.youtube.com/live2"}
    encrypted = vault.encrypt_json(data)
    decrypted = vault.decrypt_json(encrypted)
    assert decrypted == data


def test_seal_unseal_stream_key(vault):
    sealed = vault.seal_stream_key("youtube", "rtmp://a.rtmp.youtube.com/live2", "xxxx-yyyy-zzzz")
    unsealed = vault.unseal_stream_key(sealed)
    assert unsealed["platform"] == "youtube"
    assert unsealed["stream_key"] == "xxxx-yyyy-zzzz"


def test_short_master_key():
    with pytest.raises(ValueError, match="at least 16 characters"):
        VaultPro("short")


def test_different_encryptions_differ(vault):
    text = "same input"
    enc1 = vault.encrypt(text)
    enc2 = vault.encrypt(text)
    assert enc1 != enc2  # Different nonces


def test_tampered_token_fails(vault):
    encrypted = vault.encrypt("secret data")
    tampered = encrypted[:-4] + "XXXX"
    with pytest.raises(Exception):
        vault.decrypt(tampered)
