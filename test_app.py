from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # Visible para ver los resultados
    page = browser.new_page()

    print("1. Abriendo StudyOS...")
    page.goto("http://localhost:3001")
    page.wait_for_load_state("networkidle")

    print("2. Tomando screenshot del dashboard...")
    page.screenshot(
        path="C:/Users/David/Downloads/studyos-v3/test_dashboard.png", full_page=True
    )

    # Buscar cuadernos
    notebooks = page.locator(
        '[class*="notebook"], [class*="card"], [data-testid*="notebook"]'
    ).all()
    print(f"   Encontrados {len(notebooks)} elementos de cuaderno")

    # Hacer click en el primer cuaderno si existe
    try:
        print("3. Abriendo primer cuaderno...")
        first_notebook = page.locator(
            "text=Matemáticas, text=Física, text=Inglés, text=Lengua, text=Historia, text=Química"
        ).first
        first_notebook.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(
            path="C:/Users/David/Downloads/studyos-v3/test_notebook.png", full_page=True
        )
        print("   Cuaderno abierto correctamente")
    except Exception as e:
        print(f"   Buscando alternativas... {e}")

    # Buscar botones de generar contenido
    print("4. Buscando botones de generación...")
    buttons = page.locator("button").all()
    for btn in buttons:
        text = btn.inner_text()
        if text and any(
            word in text.lower()
            for word in ["flashcard", "test", "resumen", "generar", "pomodoro", "timer"]
        ):
            print(f"   Botón encontrado: {text[:50]}")

    # Buscar barra de XP
    print("5. Buscando barra de XP...")
    xp_bars = page.locator('[class*="xp"], [class*="XP"], [role="progressbar"]').all()
    print(f"   Barras XP encontradas: {len(xp_bars)}")

    # Buscar timer Pomodoro
    print("6. Buscando timer Pomodoro...")
    pomodoro = page.locator("text=/25.*min|text=/5.*min|Pomodoro|Temporizador").first
    try:
        pomodoro.wait_for(timeout=3000)
        print("   Timer Pomodoro encontrado")
    except:
        print("   Timer no visible (puede estar colapsado)")

    print("\n✅ Screenshots guardados:")
    print("   - test_dashboard.png")
    print("   - test_notebook.png")

    browser.close()
