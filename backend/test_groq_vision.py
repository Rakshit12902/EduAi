import asyncio
import os
import sys
from groq import AsyncGroq
from app.core.config import settings
import base64

async def main():
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    
    # create a dummy base64 1x1 pixel png
    dummy_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    
    response = await client.chat.completions.create(
        model="llama-3.2-11b-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is this image?"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{dummy_image}",
                        },
                    },
                ],
            }
        ],
        max_tokens=300,
    )
    print(response.choices[0].message.content)

if __name__ == "__main__":
    asyncio.run(main())
