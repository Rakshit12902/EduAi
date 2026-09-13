import jwt, base64, os
from dotenv import load_dotenv

load_dotenv()

header = base64.urlsafe_b64encode(b'{"alg":"RS256","typ":"JWT"}').decode().rstrip('=')
payload = base64.urlsafe_b64encode(b'{"sub":"123"}').decode().rstrip('=')
token = f'{header}.{payload}.invalid_signature'
secret = os.environ.get('SUPABASE_JWT_SECRET', 'test_secret').encode('utf-8')

try:
    jwt.decode(token, secret, algorithms=['HS256', 'RS256'])
    print('SUCCESS')
except Exception as e:
    print(f'ERROR TYPE: {type(e).__name__} - {e}')

