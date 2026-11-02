import asyncio
import websockets
import json

async def test_ws():
    try:
        async with websockets.connect('ws://127.0.0.1:8000/api/v1/ws') as ws:
            print('Connected successfully!')
            await ws.send(json.dumps({
                'type': 'subscribe',
                'payload': {
                    'channels': ['predictions', 'market', 'regimes'],
                    'experiment': 'EXP_D_FULL',
                    'model': 'xgboost',
                    'interval_seconds': 60
                }
            }))
            response = await asyncio.wait_for(ws.recv(), timeout=5.0)
            print('Received ack:', response)
            
            for i in range(3):
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=15.0)
                    data = json.loads(msg)
                    msg_type = data.get('type')
                    payload = data.get('payload', {})
                    keys = list(payload.keys()) if isinstance(payload, dict) else 'N/A'
                    print(f'Message {i+1}: type={msg_type}, payload keys={keys}')
                except asyncio.TimeoutError:
                    print(f'Timeout waiting for message {i+1}')
                    break
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(test_ws())