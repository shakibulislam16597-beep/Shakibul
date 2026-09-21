import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Add init script to skip splash
        await context.add_init_script("sessionStorage.setItem('extrovat_splash_seen', 'true');")

        # 1. Storefront Home
        print("Testing Storefront Home...")
        await page.goto("http://localhost:3000/#/")
        await page.wait_for_timeout(1000)
        content = await page.content()
        assert "Extrovat" in content
        await page.screenshot(path="/home/jules/verification/screenshots/verify_home_final.png")
        print("Storefront Home: OK")

        # 2. #/track Route
        print("Testing #/track Route...")
        await page.goto("http://localhost:3000/#/track")
        await page.wait_for_timeout(1000)
        content = await page.content()
        assert "Track your Extrovat order" in content
        await page.screenshot(path="/home/jules/verification/screenshots/verify_track_final.png")
        print("#/track Route: OK")

        # 3. #/admin/login Route
        print("Testing #/admin/login Route...")
        await page.goto("http://localhost:3000/#/admin/login")
        await page.wait_for_timeout(1000)
        content = await page.content()
        assert "Staff Portal" in content
        await page.screenshot(path="/home/jules/verification/screenshots/verify_admin_login_final.png")
        print("#/admin/login Route: OK")

        # 4. Login Sheet Modal trigger
        print("Testing Login Sheet modal...")
        await page.goto("http://localhost:3000/#/")
        await page.wait_for_timeout(1000)
        await page.click('button[aria-label="Log in"]')
        await page.wait_for_timeout(500)
        content = await page.content()
        assert "Customer Sign In" in content
        await page.screenshot(path="/home/jules/verification/screenshots/verify_login_sheet_final.png")
        print("Login Sheet modal: OK")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
