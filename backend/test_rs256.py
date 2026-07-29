import jwt, base64

header = base64.urlsafe_b64encode(b'{"alg":"RS256","typ":"JWT"}').decode().rstrip('=')
payload = base64.urlsafe_b64encode(b'{"sub":"123"}').decode().rstrip('=')
token = f'{header}.{payload}.invalid_signature'
secret = b'OXw4JPqRwrRhTUqyPYym8lVXiwXw+Fb7ghYVNW7K+YaXYhNZezsr0cJ3V790ca9pzCaPO7OZ8ySXwpJ4EZOJWw=='

try:
    jwt.decode(token, secret, algorithms=['HS256', 'RS256'])
    print('SUCCESS')
except Exception as e:
    print(f'ERROR TYPE: {type(e).__name__} - {e}')
