import { describe, expect, it } from "vitest";
import { guessFromUrl, guessKind, parseProductHtml } from "../src/lib/productParse.ts";

describe("guessFromUrl", () => {
  it("reads the slug and color query", () => {
    const g = guessFromUrl("https://www.jcrew.com/p/mens/categories/clothing/pants-and-chinos/chino/classic-chino-pant/BE611?color_name=dill&colorProductCode=BE611");
    expect(g.cat).toBe("pants");
    expect(g.color).toBe("#5c603a");
    expect(g.brand).toBe("Jcrew");
  });
  it("spots a blazer", () => {
    const g = guessFromUrl("https://suitsupply.com/en-us/men/jackets/navy-tailored-fit-havana-blazer/C25216.html");
    expect(g).toMatchObject({ cat: "layer", style: "blazer", color: "#1f2a45" });
  });
  it("files undershirts, socks and wallets apart", () => {
    expect(guessFromUrl("https://www.uniqlo.com/us/en/products/E465187-000/airism-cotton-crew-neck-undershirt")).toMatchObject({ cat: "undershirt" });
    expect(guessFromUrl("https://darntough.com/products/mens-merino-wool-crew-socks")).toMatchObject({ cat: "basics", style: "socks" });
    expect(guessFromUrl("https://www.redwingshoes.com/accessories/leathergoods/wallets/bifold-wallet-96582.html")).toMatchObject({ cat: "other" });
  });
});

describe("parseProductHtml", () => {
  it("prefers JSON-LD Product data", () => {
    const html = `<html><head><title>Ignore me</title>
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite"},{"@type":"Product","name":"Merino Crew Neck Sweater","brand":{"@type":"Brand","name":"Uniqlo"},"color":"Gray","image":["https://img/x.jpg"],"offers":{"@type":"Offer","price":"49.90","priceCurrency":"USD"}}]}</script>
      </head></html>`;
    const g = parseProductHtml(html, "https://www.uniqlo.com/us/en/products/E450535-000/00");
    expect(g).toMatchObject({ name: "Uniqlo Merino Crew Neck Sweater", brand: "Uniqlo", price: 49.9, image: "https://img/x.jpg", cat: "layer", style: "sweater", color: "#8b8e93" });
  });
  it("falls back to OpenGraph tags", () => {
    const html = `<meta property="og:title" content="White Leather Sneakers | Shop"><meta property="og:image" content="https://img/s.jpg"><meta property="product:price:amount" content="175.00"><meta property="og:site_name" content="Cole Haan">`;
    const g = parseProductHtml(html, "https://www.colehaan.com/products/c41964");
    expect(g).toMatchObject({ name: "Cole Haan White Leather Sneakers", price: 175, image: "https://img/s.jpg", cat: "shoes", style: "sneakers", color: "#f5f3ee" });
  });
});

describe("guessKind", () => {
  it("knows the newer styles", () => {
    const cases: [string, string, string][] = [
      ["Levi's 501 jeans", "pants", "jeans"],
      ["Slim chinos", "pants", "chinos"],
      ["Wool flannel trousers", "pants", "trousers"],
      ["Fleece joggers", "pants", "joggers"],
      ["Hooded sweatshirt", "layer", "hoodie"],
      ["Loopback crewneck sweatshirt", "layer", "crewneck"],
      ["Merino quarter-zip", "layer", "quarter-zip"],
      ["MA-1 bomber", "layer", "bomber"],
      ["Camel overcoat", "layer", "overcoat"],
      ["Canvas chore coat", "layer", "chore coat"],
      ["Merino henley", "shirt", "henley"],
      ["Brushed flannel shirt", "shirt", "flannel"],
      ["Linen camp collar shirt", "shirt", "camp collar"],
      ["Poplin dress shirt", "shirt", "dress shirt"],
      ["Suede chelsea boot", "shoes", "chelsea boot"],
      ["Leather derby", "shoes", "derby"],
      ["Leather sandals", "shoes", "sandal"],
      ["Reading glasses", "other", "glasses"],
      ["Polarised sunglasses", "other", "sunglasses"],
      ["Field watch", "other", "watch"],
      ["Silk tie", "other", "tie"],
      ["Lambswool scarf", "other", "scarf"],
      ["Wool beanie", "other", "hat"],
      ["Cotton boxer briefs", "basics", "boxer-briefs"],
      ["Woven boxers", "basics", "boxers"],
      ["Bifold wallet", "other", "other"],
    ];
    for (const [text, cat, style] of cases) expect(guessKind(text), text).toEqual({ cat, style });
  });
});
