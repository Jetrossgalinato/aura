from pathlib import Path
import sys

import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if __name__ == "__main__":
    uvicorn.run("app.api.app:app", host="0.0.0.0", port=8000, reload=True)