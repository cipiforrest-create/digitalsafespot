(function () {
  "use strict";

  const catalog = window.DigitalXShopCatalog;
  if (!catalog) return;
  const locale = document.documentElement.lang || "bs";
  const ui = locale === "en" ? {
    request: "+ Request", emptyFilter: "No services match this filter.", emptyCart: "Your selection is currently empty.", remove: "Remove", estimate: "estimate"
  } : locale === "de" ? {
    request: "+ Anfrage", emptyFilter: "Für diesen Filter wurden keine Leistungen gefunden.", emptyCart: "Ihre Auswahl ist derzeit leer.", remove: "Entfernen", estimate: "Kostenschätzung"
  } : {
    request: "+ Zahtjev", emptyFilter: "Nema proizvoda za odabrani filter.", emptyCart: "Vaš izbor je trenutno prazan.", remove: "Ukloni", estimate: "procjena"
  };
  const { categories, products } = catalog;
  const siteBase = document.body.dataset.siteBase || "..";
  const localPreview = location.protocol === "file:";
  const link = (path) => window.digitalXSiteLink
    ? window.digitalXSiteLink(path)
    : (localPreview ? `${siteBase}/${path.replace(/\/$/, "/index.html")}` : `/${path}`);
  const imagePath = (name) => link(`assets/images/${name}`);
  const productUrl = (id) => link(catalog.productPath(id));
  const categoryUrl = (id) => link(catalog.categoryPath(id));
  const money = catalog.money;
  const cartKey = "digital-x-service-cart";
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(cartKey) || "[]")
      .filter((id) => products.some((product) => product.id === id));
  } catch {
    cart = [];
  }

  const CURRENCY = "BAM";
  const dl = (window.dataLayer = window.dataLayer || []);
  const majorPrice = (product) => (product.priceMinor || 0) / 100;
  const toItem = (product, index, listName) => ({
    item_id: product.id,
    item_name: product.name,
    item_category: categories[product.category]?.name || product.category,
    price: majorPrice(product),
    quantity: 1,
    ...(index != null ? { index } : {}),
    ...(listName ? { item_list_name: listName } : {}),
  });
  const pushEcom = (event, ecommerce) => {
    dl.push({ ecommerce: null });
    dl.push({ event, ecommerce });
  };
  const cartItems = () => cart.map((id, index) => {
    const product = products.find((item) => item.id === id);
    return product ? toItem(product, index, "Korpa") : null;
  }).filter(Boolean);
  const cartValue = () => cart.reduce((sum, id) =>
    sum + majorPrice(products.find((product) => product.id === id) || {}), 0);

  function categoryNav() {
    const markup = Object.entries(categories)
      .map(([id, category]) => `<a href="${categoryUrl(id)}">${category.name}</a>`)
      .join("");
    document.querySelectorAll("[data-category-nav]").forEach((node) => {
      node.innerHTML = markup;
    });
  }

  function productCard(product) {
    return `<article class="shop-card" data-product-card="${product.id}"><a class="shop-card-image" href="${productUrl(product.id)}"><img src="${imagePath(product.image)}" alt="${product.name}" width="1600" height="1000" loading="lazy"></a><div><span>${categories[product.category].name}</span><h3><a href="${productUrl(product.id)}">${product.name}</a></h3><p>${product.summary}</p><div class="shop-card-foot"><strong>${money(product.priceMinor)}</strong><button type="button" data-add-product="${product.id}">${ui.request}</button></div></div></article>`;
  }

  function renderGrid(list, target = "[data-product-grid]") {
    const grid = document.querySelector(target);
    if (grid) {
      grid.innerHTML = list.map(productCard).join("") ||
        `<p class="empty-shop">${ui.emptyFilter}</p>`;
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch {
      // The cart still works for the current page when storage is unavailable.
    }
    renderCart();
  }

  function renderCart() {
    const selected = cart.map((id) => products.find((product) => product.id === id)).filter(Boolean);
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = String(selected.length);
    });
    const items = document.querySelector("[data-cart-items]");
    if (items) {
      items.innerHTML = selected.length
        ? selected.map((product) => `<div class="cart-item"><img src="${imagePath(product.image)}" alt="" width="160" height="100"><span><b>${product.name}</b><small>${money(product.priceMinor)}</small></span><button type="button" data-remove-product="${product.id}" aria-label="${ui.remove} ${product.name}">×</button></div>`).join("")
        : `<p>${ui.emptyCart}</p>`;
    }
    const total = selected.reduce((sum, product) => sum + (product.priceMinor || 0), 0);
    const totalNode = document.querySelector("[data-cart-total]");
    if (totalNode) {
      totalNode.textContent = selected.some((product) => product.priceMinor == null)
        ? `${money(total)} + ${ui.estimate}`
        : money(total);
    }
  }

  function openCart(open) {
    const drawer = document.querySelector("[data-cart-drawer]");
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("cart-open", open);
  }

  const view = document.querySelector("main")?.dataset.shopView;
  const routeProductId = document.body.dataset.shopProduct;
  const routeCategoryId = document.body.dataset.shopCategory;
  const routeProduct = products.find((product) => product.id === routeProductId);
  const routeCategory = categories[routeCategoryId];
  categoryNav();

  if (view === "catalog") {
    pushEcom("view_item_list", {
      item_list_name: "Katalog",
      items: products.map((product, index) => toItem(product, index, "Katalog")),
    });
  }
  if (view === "category" && routeCategory) {
    const list = products.filter((product) => product.category === routeCategoryId);
    pushEcom("view_item_list", {
      item_list_name: routeCategory.name,
      items: list.map((product, index) => toItem(product, index, routeCategory.name)),
    });
  }
  if (view === "product" && routeProduct) {
    pushEcom("view_item", {
      currency: CURRENCY,
      value: majorPrice(routeProduct),
      items: [toItem(routeProduct)],
    });
  }
  renderCart();

  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add-product]");
    if (add && !cart.includes(add.dataset.addProduct)) {
      const product = products.find((item) => item.id === add.dataset.addProduct);
      cart.push(add.dataset.addProduct);
      saveCart();
      openCart(true);
      if (product) {
        pushEcom("add_to_cart", {
          currency: CURRENCY,
          value: majorPrice(product),
          items: [toItem(product)],
        });
      }
    }

    const remove = event.target.closest("[data-remove-product]");
    if (remove) {
      const product = products.find((item) => item.id === remove.dataset.removeProduct);
      cart = cart.filter((id) => id !== remove.dataset.removeProduct);
      saveCart();
      if (product) {
        pushEcom("remove_from_cart", {
          currency: CURRENCY,
          value: majorPrice(product),
          items: [toItem(product)],
        });
      }
    }

    const productLink = event.target.closest("a[href]");
    const card = productLink?.closest("[data-product-card]");
    const product = card && products.find((item) => item.id === card.dataset.productCard);
    if (product) {
      pushEcom("select_item", {
        item_list_name: "Shop",
        items: [toItem(product, null, "Shop")],
      });
    }

    if (event.target.closest("[data-cart-open]")) {
      openCart(true);
      pushEcom("view_cart", { currency: CURRENCY, value: cartValue(), items: cartItems() });
    }
    if (event.target.closest("[data-cart-close]")) openCart(false);

    const thumb = event.target.closest("[data-gallery-image]");
    if (thumb) {
      const image = document.querySelector("[data-product-image]");
      if (image) image.src = imagePath(thumb.dataset.galleryImage);
    }

    if (event.target.closest("[data-cart-checkout]")) {
      const names = cart.map((id) => products.find((product) => product.id === id)?.name).filter(Boolean);
      pushEcom("begin_checkout", { currency: CURRENCY, value: cartValue(), items: cartItems() });
      location.href = `mailto:digital.x.agency.ba@gmail.com?subject=${encodeURIComponent("Zahtjev iz Digital X Shopa")}&body=${encodeURIComponent(`Zanima me:\n- ${names.join("\n- ")}\n\nMolim dogovor i procjenu cijene.`)}`;
    }
  });

  document.querySelector("[data-shop-search]")?.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLocaleLowerCase(locale);
    renderGrid(products.filter((product) =>
      `${product.name} ${product.summary} ${categories[product.category].name}`
        .toLocaleLowerCase(locale)
        .includes(query)));
  });
})();
