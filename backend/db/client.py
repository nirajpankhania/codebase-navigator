import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


def get_client():
    # TODO: initialise and return supabase-py client
    raise NotImplementedError("Supabase client not yet configured")
