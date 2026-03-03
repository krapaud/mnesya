"""Shared SlowAPI rate limiter instance.

Defined here to avoid circular imports between main.py and the API routers.
Import this module in both main.py (to register the exception handler)
and in any router that needs @limiter.limit().

In test environments (TESTING=true), each request gets a unique key so
no rate limit is ever hit during the test suite.
"""

import os
import uuid
from slowapi import Limiter
from slowapi.util import get_remote_address


def _limiter_key_func(request):
    """Use a unique key per request when testing to bypass rate limits."""
    if os.environ.get("TESTING", "false").lower() == "true":
        return str(uuid.uuid4())
    return get_remote_address(request)


limiter = Limiter(key_func=_limiter_key_func)
