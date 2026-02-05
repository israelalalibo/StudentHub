"""
Locust load test for UniMarket (E-com) application.

Endpoints under test:
- POST /signin (JSON: email, password) -> session used as Bearer token for API
- Public: /, /api/featured-products, /api/products/search, /search
- Authenticated: /api/profile, /api/cart, /api/cart/count, /api/my-listings, /api/purchases

Run locally:
  locust -f locustfile.py --host=http://localhost:3000
  Then open http://localhost:8089

Run against Vercel deployment:
  locust -f locustfile.py --host=https://YOUR_APP.vercel.app
  Or set host via env (Locust reads LOCUST_HOST if --host is not set):
  set LOCUST_HOST=https://YOUR_APP.vercel.app
  locust -f locustfile.py

Test user: create one in your app, then set env vars or edit below:
  LOCUST_TEST_EMAIL=your@test.user
  LOCUST_TEST_PASSWORD=YourPassword
"""

import os
from locust import HttpUser, task, between


# Credentials for login stress test (one test user, many concurrent logins)
TEST_EMAIL = os.environ.get("LOCUST_TEST_EMAIL", "loadtest@example.com")
TEST_PASSWORD = os.environ.get("LOCUST_TEST_PASSWORD", "LoadTest123!")


class UniMarketUser(HttpUser):
    """
    Simulates a logged-in user: signs in once, then browses and uses API.
    Each new virtual user = one concurrent login in on_start.
    """
    wait_time = between(1, 4)

    def on_start(self):
        """Log in once per virtual user. Stores token for authenticated API calls."""
        self.token = None
        self.user_id = None
        with self.client.post(
            "/signin",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"},
            catch_response=True,
            name="/signin [login]",
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    session = data.get("session") or {}
                    self.token = session.get("access_token")
                    self.user_id = data.get("userID")
                except (ValueError, KeyError):
                    response.failure("Missing token in signin response")
            else:
                response.failure(f"Login failed: {response.status_code}")

    def _auth_headers(self):
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}

    # ---- Public (browse) - high frequency ----
    @task(weight=5)
    def view_featured_products(self):
        self.client.get(
            "/api/featured-products",
            name="/api/featured-products",
        )

    @task(weight=4)
    def search_products(self):
        self.client.get(
            "/api/products/search?q=book&limit=20",
            name="/api/products/search",
        )

    @task(weight=3)
    def search_full(self):
        self.client.get(
            "/search?q=book",
            name="/search",
        )

    @task(weight=2)
    def view_landing(self):
        self.client.get("/", name="/ [landing]")
        self.client.get("/api/featured-products", name="/api/featured-products")

    # ---- Authenticated - medium frequency ----
    @task(weight=3)
    def view_profile(self):
        if self.token:
            self.client.get(
                "/api/profile",
                headers=self._auth_headers(),
                name="/api/profile",
            )

    @task(weight=3)
    def view_cart_count(self):
        if self.token:
            self.client.get(
                "/api/cart/count",
                headers=self._auth_headers(),
                name="/api/cart/count",
            )

    @task(weight=2)
    def view_cart(self):
        if self.token:
            self.client.get(
                "/api/cart",
                headers=self._auth_headers(),
                name="/api/cart",
            )

    @task(weight=1)
    def view_my_listings(self):
        if self.token:
            self.client.get(
                "/api/my-listings",
                headers=self._auth_headers(),
                name="/api/my-listings",
            )

    @task(weight=1)
    def view_purchases(self):
        if self.token:
            self.client.get(
                "/api/purchases",
                headers=self._auth_headers(),
                name="/api/purchases",
            )


class AnonymousBrowser(HttpUser):
    """
    Simulates users who never log in: only hit public pages and search.
    Use this to mix anonymous traffic with logged-in users (start both user classes).
    """
    wait_time = between(1, 5)

    @task(weight=5)
    def featured_products(self):
        self.client.get("/api/featured-products", name="/api/featured-products [anon]")

    @task(weight=4)
    def product_search(self):
        self.client.get(
            "/api/products/search?limit=15",
            name="/api/products/search [anon]",
        )

    @task(weight=2)
    def search_page(self):
        self.client.get("/search?q=textbook", name="/search [anon]")

    @task(weight=1)
    def landing(self):
        self.client.get("/", name="/ [anon]")
