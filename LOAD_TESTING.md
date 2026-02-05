# Load testing (Locust)

Use Locust to stress-test the app locally or on **Vercel**.

## Test your Vercel deployment

1. **Get your live URL**  
   From the Vercel dashboard or CLI: e.g. `https://your-project.vercel.app` (or your custom domain).

2. **Install Locust** (if needed):
   ```bash
   pip install locust
   ```

3. **Run Locust against Vercel**:
   ```bash
   locust -f locustfile.py --host=https://your-project.vercel.app
   ```
   If `locust` is not recognized (e.g. on Windows), run via Python:
   ```bash
   python -m locust -f locustfile.py --host=https://your-project.vercel.app
   ```
   (On Windows you may need `py -m locust` instead of `python -m locust`.)
   Replace `https://your-project.vercel.app` with your real Vercel URL.

4. **Open the UI**:  
   In your browser go to **http://localhost:8089**.  
   Set number of users and spawn rate, then click **Start swarming**.

5. **Optional – set host via env** (so you don’t type the URL every time):
   - **PowerShell:**
     ```powershell
     $env:LOCUST_HOST="https://your-project.vercel.app"
     locust -f locustfile.py
     ```
   - **Cmd:**
     ```set LOCUST_HOST=https://your-project.vercel.app
     locust -f locustfile.py
     ```
   - **Bash:**
     ```bash
     export LOCUST_HOST=https://your-project.vercel.app
     locust -f locustfile.py
     ```

6. **Test user**  
   Create a real user on your deployed app (or in Supabase), then pass credentials:
   - **PowerShell:**
     ```powershell
     $env:LOCUST_TEST_EMAIL="your@email.com"; $env:LOCUST_TEST_PASSWORD="YourPassword"
     locust -f locustfile.py --host=https://your-project.vercel.app
     ```

## Vercel notes

- **Cold starts**: First requests after idle can be slower; ramp users gradually (e.g. spawn rate 2–5/s) to see warm vs cold behaviour.
- **Timeouts**: Vercel serverless functions have execution limits (e.g. 10s on Hobby). If you see timeouts, reduce load or optimize slow routes.
- **Supabase/Stripe**: Load tests hit your real backend (Supabase, Stripe). Use a test user and be aware of plan/rate limits.

## Headless (no UI)

Run a fixed number of users for a fixed time and print a report:

```bash
locust -f locustfile.py --host=https://your-project.vercel.app --headless -u 50 -r 5 -t 60s
```

- `-u 50`: 50 users  
- `-r 5`: spawn 5 users per second  
- `-t 60s`: run for 60 seconds  

Report is printed in the terminal when the run finishes.
