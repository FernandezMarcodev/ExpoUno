# Genera un par de claves VAPID (url-safe base64 sin padding) para Web Push.
# Uso: python generar_vapid.py
# Luego se copian a .env / .env.example como VAPID_PRIVATE_KEY y VAPID_PUBLIC_KEY,
# y se configuran VAPID_SUBJECT (mailto: o https).
import base64

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


def _b64url(datos: bytes) -> str:
    return base64.urlsafe_b64encode(datos).rstrip(b"=").decode("ascii")


def main():
    clave = ec.generate_private_key(ec.SECP256R1())
    tamano = (clave.curve.key_size + 7) // 8
    privada = clave.private_numbers().private_value.to_bytes(tamano, byteorder="big", signed=False)
    publica = clave.public_key().public_bytes(
        serialization.Encoding.X962,
        serialization.PublicFormat.UncompressedPoint,
    )
    print("VAPID_PRIVATE_KEY=" + _b64url(privada))
    print("VAPID_PUBLIC_KEY=" + _b64url(publica))
    print("VAPID_SUBJECT=mailto:tu@correo.com")


if __name__ == "__main__":
    main()