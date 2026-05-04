import asyncio
import logging
from engine import engine

logging.basicConfig(level=logging.INFO)

async def test():
    # Fetch real data
    resp = await engine.get_current_top10_real()
    print("Total opportunities:", len(resp.opportunities))
    real_opps = [o for o in resp.opportunities if 'mock' not in o.id]
    print("Real opportunities count:", len(real_opps))

asyncio.run(test())
