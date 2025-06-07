import os
import pytest

@pytest.fixture(scope="session")
def auth_token():
    token = os.environ.get("TEST_AUTH_TOKEN")
    if not token:
        pytest.skip("TEST_AUTH_TOKEN environment variable not set")
    return token
