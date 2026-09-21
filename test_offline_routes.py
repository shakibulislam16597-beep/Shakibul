import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Set sessionStorage in context init script before loading
        await context.add_init_script("sessionStorage.setItem('extrovat_splash_seen', 'true');")

        # 1. Storefront Home
        print("Testing Storefront Home...")
        await page.goto("http://localhost:3000/#/")
        await page.wait_for_timeout(1000)
        content = await page.content()
        assert "Extrovat" in content
        await page.screenshot(path="/home/jules/verification/screenshots/verify_storefront.png")
        print("Storefront Home render: OK")

        # 2. #/track Route
        print("Testing #/track Route...")
        await page.goto("http://localhost:3000/#/track")
        await page.wait_for_timeout(1000)
        content = await page.content()
        assert "Track your Extrovat order" in content
        await page.screenshot(path="/home/jules/verification/screenshots/verify_track.png")
        print("#/track Route render: OK")

        # 3. #/admin/login Route
        print("Testing #/admin/login Route...")
        await page.goto("http://localhost:3000/#/admin/login")
        await page.wait_for_timeout(1000)
        content = await page.content()
        assert "Staff Portal" in content
        await page.screenshot(path="/home/jules/verification/screenshots/verify_admin_login.png")
        print("#/admin/login Route render: OK")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
