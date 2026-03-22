export type FoodCostStatus = "ok" | "high_cost" | "loss" | "missing_cost";

export type RecipeLine = {
  type: string | null;
  ingredient: string;
  unit: string | null;
  amountPerPortion: number | null;
  costPerPortion: number | null;
  note: string | null;
};

export type FoodCostItem = {
  item: string;
  category: string;
  description: string;
  sellPrice: number | null;
  unitFoodCost: number | null;
  foodCostPct: number | null;
  unitProfit: number | null;
  unitsSold: number | null;
  totalFoodCost: number | null;
  totalSales: number | null;
  contributionMargin: number | null;
  popularityCategory: string | null;
  status: FoodCostStatus;
  recipe: RecipeLine[];
};

export type FoodCostDataset = {
  summary: {
    store: string;
    period: string;
    prepared: string;
    allItemsSold: number | null;
    overallMenuSales: number | null;
    avgNumberSold: number | null;
  };
  items: FoodCostItem[];
};

export const veryAcai2024: FoodCostDataset = {
  "summary": {
    "store": "Very Acai",
    "period": "2024",
    "prepared": "November 2024",
    "allItemsSold": 2091.0,
    "overallMenuSales": 12752.0,
    "avgNumberSold": 53.61538462
  },
  "items": [
    {
      "item": "THE ORIGINAL",
      "category": "AÇAI BOWLS",
      "description": "Base: Açai , Banana, Berries. Topping: Banana, Strawnerries, Honey, Granola",
      "sellPrice": 10.0,
      "unitFoodCost": 1.9467,
      "foodCostPct": 0.19467,
      "unitProfit": 8.0533,
      "unitsSold": 22.0,
      "totalFoodCost": 42.8274,
      "totalSales": 220.0,
      "contributionMargin": 177.1726,
      "popularityCategory": "Low",
      "status": "ok",
      "recipe": [
        {
          "type": "Base",
          "ingredient": "Açai",
          "unit": "Kg",
          "amountPerPortion": 0.18,
          "costPerPortion": 1.44,
          "note": "300gr"
        },
        {
          "type": "Topping",
          "ingredient": "Granola",
          "unit": "Kg",
          "amountPerPortion": 0.05,
          "costPerPortion": 0.1425,
          "note": "50gr"
        },
        {
          "type": "Topping",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 0.05,
          "costPerPortion": 0.0675,
          "note": "60gr"
        },
        {
          "type": "Topping",
          "ingredient": "Strawberries",
          "unit": "Kg",
          "amountPerPortion": 0.02,
          "costPerPortion": 0.2632,
          "note": "20gr"
        },
        {
          "type": "Topping",
          "ingredient": "Honey",
          "unit": "Kg",
          "amountPerPortion": 0.005,
          "costPerPortion": 0.0335,
          "note": "5ml"
        }
      ]
    },
    {
      "item": "THE PROTEIN",
      "category": "AÇAI BOWLS",
      "description": "Base: Açai , Banana, Vanilla Vegan Protein. Topping: Fruit, Hemps Seeds, Granola",
      "sellPrice": 12.5,
      "unitFoodCost": 22.68,
      "foodCostPct": 1.8144,
      "unitProfit": -10.18,
      "unitsSold": 25.0,
      "totalFoodCost": 567.0,
      "totalSales": 312.5,
      "contributionMargin": -254.5,
      "popularityCategory": "Low",
      "status": "loss",
      "recipe": [
        {
          "type": "Base",
          "ingredient": "Açai",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 8.0,
          "note": "300gr"
        },
        {
          "type": "Base",
          "ingredient": "Vanilla Vegan Protein",
          "unit": "1kg",
          "amountPerPortion": 0.2,
          "costPerPortion": 5.398,
          "note": "20gr"
        },
        {
          "type": "Topping",
          "ingredient": "Granola",
          "unit": "Kg",
          "amountPerPortion": 0.5,
          "costPerPortion": 1.425,
          "note": "50gr"
        },
        {
          "type": "Topping",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 0.6,
          "costPerPortion": 0.81,
          "note": "60gr"
        },
        {
          "type": "Topping",
          "ingredient": "Blueberries",
          "unit": "1nr",
          "amountPerPortion": 0.05,
          "costPerPortion": 0.2,
          "note": "5gr"
        },
        {
          "type": "Topping",
          "ingredient": "Strawberries",
          "unit": "Kg",
          "amountPerPortion": 0.2,
          "costPerPortion": 2.632,
          "note": "20gr"
        },
        {
          "type": "Topping",
          "ingredient": "Hemps Seeds",
          "unit": "1kg",
          "amountPerPortion": 0.3,
          "costPerPortion": 4.215,
          "note": "3g"
        }
      ]
    },
    {
      "item": "PEANUTS",
      "category": "AÇAI BOWLS",
      "description": "Blend: Açai , Banana, Berries Topping: Peanut Butter*, 2 Fruits, Granola*",
      "sellPrice": 11.5,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 43.0,
      "totalFoodCost": null,
      "totalSales": 494.5,
      "contributionMargin": null,
      "popularityCategory": "Low",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Base",
          "ingredient": "Açai",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 8.0,
          "note": "300gr"
        },
        {
          "type": "Topping",
          "ingredient": "Granola",
          "unit": "Kg",
          "amountPerPortion": 0.5,
          "costPerPortion": 1.425,
          "note": "50gr"
        },
        {
          "type": "Topping",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 0.6,
          "costPerPortion": 0.81,
          "note": "60gr"
        },
        {
          "type": "Topping",
          "ingredient": "Strawberries",
          "unit": "Kg",
          "amountPerPortion": 0.2,
          "costPerPortion": 2.632,
          "note": "20gr"
        },
        {
          "type": "Topping",
          "ingredient": "Peanut Butter",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "50gr"
        }
      ]
    },
    {
      "item": "BRO'S- DOUBLE PEANUT!",
      "category": "AÇAI BOWLS",
      "description": "Base: Açai +Guarana, Banana, Peanut Butter, Strawberries. Topping: Banana, Peanut Butter,, ChocGranola",
      "sellPrice": 12.5,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 17.0,
      "totalFoodCost": null,
      "totalSales": 212.5,
      "contributionMargin": null,
      "popularityCategory": "Low",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Base",
          "ingredient": "Açai Guaranà",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 8.3,
          "note": "300gr"
        },
        {
          "type": "Base",
          "ingredient": "Peanut Butter",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "50gr"
        },
        {
          "type": "Topping",
          "ingredient": "Granola",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 2.85,
          "note": "100gr"
        },
        {
          "type": "Topping",
          "ingredient": "Cocoa powder",
          "unit": "1kg",
          "amountPerPortion": 0.3,
          "costPerPortion": 5.19,
          "note": "3g"
        },
        {
          "type": "Topping",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 0.6,
          "costPerPortion": 0.81,
          "note": "60gr"
        },
        {
          "type": "Topping",
          "ingredient": "Strawberries",
          "unit": "Kg",
          "amountPerPortion": 0.2,
          "costPerPortion": 2.632,
          "note": "20gr"
        },
        {
          "type": "Topping",
          "ingredient": "Peanut Butter",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "50gr"
        }
      ]
    },
    {
      "item": "ALICE'S WONDERLAND",
      "category": "AÇAI BOWLS",
      "description": "Base: Açai , Banana, Berries. Topping: Banana, Strawnerries, Coconut Granola and Coconut Flakes",
      "sellPrice": 11.0,
      "unitFoodCost": 40.7065,
      "foodCostPct": 3.700590909090909,
      "unitProfit": -29.7065,
      "unitsSold": 55.0,
      "totalFoodCost": 2238.8575,
      "totalSales": 605.0,
      "contributionMargin": -1633.8575,
      "popularityCategory": "High",
      "status": "loss",
      "recipe": [
        {
          "type": "Base",
          "ingredient": "Açai",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 8.0,
          "note": "300gr"
        },
        {
          "type": "Topping",
          "ingredient": "Granola",
          "unit": "Kg",
          "amountPerPortion": 0.5,
          "costPerPortion": 1.425,
          "note": "50gr"
        },
        {
          "type": "Topping",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 0.6,
          "costPerPortion": 0.81,
          "note": "60gr"
        },
        {
          "type": "Topping",
          "ingredient": "Strawberries",
          "unit": "Kg",
          "amountPerPortion": 0.2,
          "costPerPortion": 2.632,
          "note": "20gr"
        },
        {
          "type": "Topping",
          "ingredient": "Coconut Flakes",
          "unit": "1kg",
          "amountPerPortion": 0.05,
          "costPerPortion": 0.8495,
          "note": "5g"
        },
        {
          "type": "Topping",
          "ingredient": "Cacao nibs",
          "unit": "1kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 26.99,
          "note": "5g"
        }
      ]
    },
    {
      "item": "LEO'S- THE CHAMP",
      "category": "AÇAI BOWLS",
      "description": "Base: Açai -Guarana, Banana Topping: Banana, Pear, Peanut Butter, Red berries Granola",
      "sellPrice": 12.0,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 30.0,
      "totalFoodCost": null,
      "totalSales": 360.0,
      "contributionMargin": null,
      "popularityCategory": "Low",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Base",
          "ingredient": "Açai",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 8.0,
          "note": "300gr"
        },
        {
          "type": "Topping",
          "ingredient": "Granola",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 2.85,
          "note": "50gr"
        },
        {
          "type": "Topping",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.35,
          "note": "60gr"
        },
        {
          "type": "Topping",
          "ingredient": "Pear",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 3.5,
          "note": "20gr"
        },
        {
          "type": "Topping",
          "ingredient": "Peanut Butter",
          "unit": null,
          "amountPerPortion": 0.1,
          "costPerPortion": null,
          "note": "40gr"
        }
      ]
    },
    {
      "item": "NUTTY- GLUTEN FREE",
      "category": "AÇAI BOWLS",
      "description": "Blend: Açai , Banana, Berries Topping: Nuts and Seeds Mix, 2 Fruits",
      "sellPrice": 12.0,
      "unitFoodCost": 43.78,
      "foodCostPct": 3.6483333333333334,
      "unitProfit": -31.78,
      "unitsSold": 85.0,
      "totalFoodCost": 3721.3,
      "totalSales": 1020.0,
      "contributionMargin": -2701.3,
      "popularityCategory": "High",
      "status": "loss",
      "recipe": [
        {
          "type": "Base",
          "ingredient": "Açai",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 8.0,
          "note": "300gr"
        },
        {
          "type": "Topping",
          "ingredient": "Mixed nuts",
          "unit": "500gr",
          "amountPerPortion": 1.0,
          "costPerPortion": 6.08,
          "note": "50gr"
        },
        {
          "type": "Topping",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.35,
          "note": "60gr"
        },
        {
          "type": "Topping",
          "ingredient": "Strawberries",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 13.16,
          "note": "20gr"
        },
        {
          "type": "Topping",
          "ingredient": "Chia",
          "unit": "1kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 15.19,
          "note": "3g"
        }
      ]
    },
    {
      "item": "AVO TOAST",
      "category": "BREAD & BITES",
      "description": "Pane lievito madre, Avocado, Semi di Zucca, Olio EVO, lime, Sale nero delle Hawaii",
      "sellPrice": 5.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 5.0,
      "unitsSold": 31.0,
      "totalFoodCost": 0.0,
      "totalSales": 155.0,
      "contributionMargin": 155.0,
      "popularityCategory": "Low",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "NY BAGEL",
      "category": "BREAD & BITES",
      "description": "No two bagels are alike! Artisanal bagels are all hand-rolled & shaped, boiled and baked. Choose your favourite: Plain, Seasame and Everything.",
      "sellPrice": 4.0,
      "unitFoodCost": 1.36,
      "foodCostPct": 0.34,
      "unitProfit": 2.64,
      "unitsSold": 41.0,
      "totalFoodCost": 55.76,
      "totalSales": 164.0,
      "contributionMargin": 108.24,
      "popularityCategory": "Low",
      "status": "ok",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Bagel",
          "unit": "1nr",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.36,
          "note": "#N/A"
        }
      ]
    },
    {
      "item": "Iced Latte",
      "category": "ICED COFFEE, TEA & LATTES",
      "description": "Espresso, Foamy Mylk, Maple Syrup, Ice",
      "sellPrice": 4.5,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 4.5,
      "unitsSold": 89.0,
      "totalFoodCost": 0.0,
      "totalSales": 400.5,
      "contributionMargin": 400.5,
      "popularityCategory": "High",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "Iced Americano",
      "category": "ICED COFFEE, TEA & LATTES",
      "description": "2 Shots of Espresso over Ice",
      "sellPrice": 3.5,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 3.5,
      "unitsSold": 47.0,
      "totalFoodCost": 0.0,
      "totalSales": 164.5,
      "contributionMargin": 164.5,
      "popularityCategory": "Low",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "Iced Tea",
      "category": "ICED COFFEE, TEA & LATTES",
      "description": "Clipper Tea, lime, maple syrup and Ice",
      "sellPrice": 4.5,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 4.5,
      "unitsSold": 74.0,
      "totalFoodCost": 0.0,
      "totalSales": 333.0,
      "contributionMargin": 333.0,
      "popularityCategory": "High",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "Iced Ginger \"Tea\"",
      "category": "ICED COFFEE, TEA & LATTES",
      "description": "Fresh Ginger, lemon, cayenne, cinnamon, maple, ice",
      "sellPrice": 4.5,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 4.5,
      "unitsSold": 32.0,
      "totalFoodCost": 0.0,
      "totalSales": 144.0,
      "contributionMargin": 144.0,
      "popularityCategory": "Low",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "Iced Matcha Latte",
      "category": "ICED COFFEE, TEA & LATTES",
      "description": "Premium Grade Organic Matcha, Almond Mylk, Ice",
      "sellPrice": 4.5,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 86.0,
      "totalFoodCost": null,
      "totalSales": 387.0,
      "contributionMargin": null,
      "popularityCategory": "High",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Premium Grade Organic Matcha",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "#N/A"
        },
        {
          "type": "Part",
          "ingredient": "Almon Milk",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "#N/A"
        },
        {
          "type": "Part",
          "ingredient": "Ice",
          "unit": "1nr",
          "amountPerPortion": 1.0,
          "costPerPortion": 6.0,
          "note": "#N/A"
        }
      ]
    },
    {
      "item": "Iced Pink Latte",
      "category": "ICED COFFEE, TEA & LATTES",
      "description": "Coconut Mylk, Beet Root, Strawberry Ice",
      "sellPrice": 4.5,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 16.0,
      "totalFoodCost": null,
      "totalSales": 72.0,
      "contributionMargin": null,
      "popularityCategory": "Low",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Coconut Milk",
          "unit": "1l",
          "amountPerPortion": 1.0,
          "costPerPortion": 2.65,
          "note": "#N/A"
        },
        {
          "type": "Part",
          "ingredient": "Beetroot",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "#N/A"
        },
        {
          "type": "Part",
          "ingredient": "Strawberry",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "#N/A"
        },
        {
          "type": "Part",
          "ingredient": "Ice",
          "unit": "1nr",
          "amountPerPortion": 1.0,
          "costPerPortion": 6.0,
          "note": "#N/A"
        }
      ]
    },
    {
      "item": "THE COOLER- Special Edition July",
      "category": "SMOOTHIES",
      "description": "Pineapple, Coconut Water, Apple, Lime, Mint and Maple Syrup",
      "sellPrice": 6.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 6.0,
      "unitsSold": 82.0,
      "totalFoodCost": 0.0,
      "totalSales": 492.0,
      "contributionMargin": 492.0,
      "popularityCategory": "High",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "AÇAI&BERRIES",
      "category": "SMOOTHIES",
      "description": "Açai, Berries, Banana",
      "sellPrice": 5.0,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 10.0,
      "totalFoodCost": null,
      "totalSales": 50.0,
      "contributionMargin": null,
      "popularityCategory": "Low",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Açai",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 8.0,
          "note": "#N/A"
        },
        {
          "type": "Part",
          "ingredient": "Mix Berries surgelato",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "30g"
        },
        {
          "type": "Part",
          "ingredient": "Water",
          "unit": null,
          "amountPerPortion": null,
          "costPerPortion": null,
          "note": "130ml"
        },
        {
          "type": "Part",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.35,
          "note": "120gr"
        }
      ]
    },
    {
      "item": "KETO Açai",
      "category": "SMOOTHIES",
      "description": "Açai, Avocado, Yogurt Greco, Berries, Lucuma, Cinnamon",
      "sellPrice": 7.0,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 77.0,
      "totalFoodCost": null,
      "totalSales": 539.0,
      "contributionMargin": null,
      "popularityCategory": "High",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Açai",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 8.0,
          "note": "#N/A"
        },
        {
          "type": "Part",
          "ingredient": "Avocado surgelato",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "30gr"
        },
        {
          "type": "Part",
          "ingredient": "Greek Yogurt",
          "unit": "1kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 3.9,
          "note": "50gr"
        },
        {
          "type": "Part",
          "ingredient": "Mix Berries surgelato",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "20gr"
        },
        {
          "type": "Part",
          "ingredient": "Lucuma",
          "unit": "200gr",
          "amountPerPortion": 1.0,
          "costPerPortion": 13.3,
          "note": "3gr"
        },
        {
          "type": "Part",
          "ingredient": "Cinnamon",
          "unit": "gr",
          "amountPerPortion": 1.0,
          "costPerPortion": 0.0,
          "note": "1gr"
        }
      ]
    },
    {
      "item": "TROPICAL ENERGIZER",
      "category": "SMOOTHIES",
      "description": "Açai+Guarana, Mango, Banana, Ginger, Coconut",
      "sellPrice": 6.0,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 31.0,
      "totalFoodCost": null,
      "totalSales": 186.0,
      "contributionMargin": null,
      "popularityCategory": "Low",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Açai-Guarana",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "100gr"
        },
        {
          "type": "Part",
          "ingredient": "Water",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "50ml"
        },
        {
          "type": "Part",
          "ingredient": "Mango",
          "unit": "1nr",
          "amountPerPortion": 1.0,
          "costPerPortion": 2.5,
          "note": "60gr"
        },
        {
          "type": "Part",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.35,
          "note": "100gr"
        },
        {
          "type": "Part",
          "ingredient": "Ginger",
          "unit": "1kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 10.1,
          "note": "3gr"
        },
        {
          "type": "Part",
          "ingredient": "Coconut milk",
          "unit": "1l",
          "amountPerPortion": 1.0,
          "costPerPortion": 2.65,
          "note": "150ml"
        }
      ]
    },
    {
      "item": "YO Açai",
      "category": "SMOOTHIES",
      "description": "Açai, Banana, Greek Yogurt*, Goji, Honey, Nuts*",
      "sellPrice": 6.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 6.0,
      "unitsSold": 30.0,
      "totalFoodCost": 0.0,
      "totalSales": 180.0,
      "contributionMargin": 180.0,
      "popularityCategory": "Low",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "PB&Açai",
      "category": "SMOOTHIES",
      "description": "Açai, Banana, Strawberries, Peanut Butter*, Cacao Nibs",
      "sellPrice": 6.0,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 36.0,
      "totalFoodCost": null,
      "totalSales": 216.0,
      "contributionMargin": null,
      "popularityCategory": "Low",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Açai",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 8.0,
          "note": "#N/A"
        },
        {
          "type": "Part",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.35,
          "note": "120gr"
        },
        {
          "type": "Part",
          "ingredient": "Strawberries",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 13.16,
          "note": "20gr"
        },
        {
          "type": "Part",
          "ingredient": "Peanut Butter",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "40gr"
        },
        {
          "type": "Part",
          "ingredient": "Water",
          "unit": null,
          "amountPerPortion": null,
          "costPerPortion": null,
          "note": "130ml"
        },
        {
          "type": "Part",
          "ingredient": "Cacao Nibs",
          "unit": "1kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 26.99,
          "note": "4gr"
        }
      ]
    },
    {
      "item": "BERRY BOOST",
      "category": "SMOOTHIES",
      "description": "Mixed Berries, Greek Yogurt, Apple, Banana, Honey",
      "sellPrice": 5.4,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 70.0,
      "totalFoodCost": null,
      "totalSales": 378.0,
      "contributionMargin": null,
      "popularityCategory": "High",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Mixed Berries",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "50gr"
        },
        {
          "type": "Part",
          "ingredient": "Greek Yogurt",
          "unit": "1kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 3.9,
          "note": "40gr"
        },
        {
          "type": "Part",
          "ingredient": "Apple",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "60gr"
        },
        {
          "type": "Part",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.35,
          "note": "60gr"
        },
        {
          "type": "Part",
          "ingredient": "Honey",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 6.7,
          "note": "5ml"
        }
      ]
    },
    {
      "item": "GREEN DETOX",
      "category": "SMOOTHIES",
      "description": "Rockets, Green Apple, Cucumber, Ginger, lime",
      "sellPrice": 5.5,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 64.0,
      "totalFoodCost": null,
      "totalSales": 352.0,
      "contributionMargin": null,
      "popularityCategory": "High",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Arucula",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "30gr"
        },
        {
          "type": "Part",
          "ingredient": "Green Apple",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.8,
          "note": "50gr"
        },
        {
          "type": "Part",
          "ingredient": "Cucumber",
          "unit": "1kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.85,
          "note": "110gr"
        },
        {
          "type": "Part",
          "ingredient": "Ginger",
          "unit": "1kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 10.1,
          "note": "3gr"
        },
        {
          "type": "Part",
          "ingredient": "Lime",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 3.5,
          "note": "5gr"
        },
        {
          "type": "Part",
          "ingredient": "Water",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "200ml"
        }
      ]
    },
    {
      "item": "GINGER COLADA",
      "category": "SMOOTHIES",
      "description": "Baby Spinach, Kale, Pineapple, Banana, Ginger, Coconut, Lemon",
      "sellPrice": 6.0,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 37.0,
      "totalFoodCost": null,
      "totalSales": 222.0,
      "contributionMargin": null,
      "popularityCategory": "Low",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Baby Spinach",
          "unit": "1nr",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.5,
          "note": "30gr"
        },
        {
          "type": "Part",
          "ingredient": "Arucula",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "40gr"
        },
        {
          "type": "Part",
          "ingredient": "Pineapple",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "30gr"
        },
        {
          "type": "Part",
          "ingredient": "Ginger",
          "unit": "1kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 10.1,
          "note": "3gr"
        },
        {
          "type": "Part",
          "ingredient": "Coconut milk",
          "unit": "1l",
          "amountPerPortion": 1.0,
          "costPerPortion": 2.65,
          "note": "170ml"
        }
      ]
    },
    {
      "item": "POPEYE",
      "category": "SMOOTHIES",
      "description": "Baby Spinach, Mango, Banana, lime, chia",
      "sellPrice": 6.0,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 31.0,
      "totalFoodCost": null,
      "totalSales": 186.0,
      "contributionMargin": null,
      "popularityCategory": "Low",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Baby Spinach",
          "unit": "1nr",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.5,
          "note": "40gr"
        },
        {
          "type": "Part",
          "ingredient": "Pineapple",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "60gr"
        },
        {
          "type": "Part",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.35,
          "note": "120gr"
        },
        {
          "type": "Part",
          "ingredient": "Lime",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 3.5,
          "note": "5gr"
        },
        {
          "type": "Part",
          "ingredient": "Water",
          "unit": null,
          "amountPerPortion": null,
          "costPerPortion": null,
          "note": "200ml"
        },
        {
          "type": "Part",
          "ingredient": "Chia",
          "unit": "1kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 15.19,
          "note": "3gr"
        }
      ]
    },
    {
      "item": "HANGOVER HERO",
      "category": "SMOOTHIES",
      "description": "Coconut Water, Pineapple, Cucumber, Baobab, Chia",
      "sellPrice": 6.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 6.0,
      "unitsSold": 89.0,
      "totalFoodCost": 0.0,
      "totalSales": 534.0,
      "contributionMargin": 534.0,
      "popularityCategory": "High",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "APPLE PIE",
      "category": "SMOOTHIES",
      "description": "Apple, Banana, Greek Yogurt, Cinnamon",
      "sellPrice": 5.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 5.0,
      "unitsSold": 90.0,
      "totalFoodCost": 0.0,
      "totalSales": 450.0,
      "contributionMargin": 450.0,
      "popularityCategory": "High",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "CLASSIC",
      "category": "SMOOTHIES",
      "description": "Banana, Strawberries, Mylk Vegan",
      "sellPrice": 4.5,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 4.5,
      "unitsSold": 98.0,
      "totalFoodCost": 0.0,
      "totalSales": 441.0,
      "contributionMargin": 441.0,
      "popularityCategory": "High",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "TUTTI FRUTTI",
      "category": "SMOOTHIES",
      "description": "Mixed Berries, Apple, Banana, Pineapple, Kiwi, Greek Yogurt*",
      "sellPrice": 5.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 5.0,
      "unitsSold": 65.0,
      "totalFoodCost": 0.0,
      "totalSales": 325.0,
      "contributionMargin": 325.0,
      "popularityCategory": "High",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "BANANA+CHOCO",
      "category": "SMOOTHIES",
      "description": "Almond Mylk, Banana, Cocoa, Maple Syrup",
      "sellPrice": 5.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 5.0,
      "unitsSold": 18.0,
      "totalFoodCost": 0.0,
      "totalSales": 90.0,
      "contributionMargin": 90.0,
      "popularityCategory": "Low",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "STRAE-BEET DETOX",
      "category": "SMOOTHIES",
      "description": "Beet, Banana, Apple, Cinnamon, Peppermint essential oil",
      "sellPrice": 6.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 6.0,
      "unitsSold": 46.0,
      "totalFoodCost": 0.0,
      "totalSales": 276.0,
      "contributionMargin": 276.0,
      "popularityCategory": "Low",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "BERRY GAINS 500 ml",
      "category": "VEGAN PROTEINS SMOOTHIES",
      "description": "Açai, Banana, Mixed Berries, Vegan Vanilla Protein, Coconut Water",
      "sellPrice": 8.5,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 58.0,
      "totalFoodCost": null,
      "totalSales": 493.0,
      "contributionMargin": null,
      "popularityCategory": "High",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Açai",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 8.0,
          "note": "#N/A"
        },
        {
          "type": "Part",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.35,
          "note": "120gr"
        },
        {
          "type": "Part",
          "ingredient": "Berries",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "20gr"
        },
        {
          "type": "Part",
          "ingredient": "Vegan Vanilla Protein",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "10gr"
        },
        {
          "type": "Part",
          "ingredient": "Coconut milk",
          "unit": "1l",
          "amountPerPortion": 1.0,
          "costPerPortion": 2.65,
          "note": "200ml"
        }
      ]
    },
    {
      "item": "DARK BERRY PROTEIN 500 ml",
      "category": "VEGAN PROTEINS SMOOTHIES",
      "description": "Açai,+Guarana, Berries, Banana, Choc Vegan Protein, Cocoa",
      "sellPrice": 8.5,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 8.5,
      "unitsSold": 40.0,
      "totalFoodCost": 0.0,
      "totalSales": 340.0,
      "contributionMargin": 340.0,
      "popularityCategory": "Low",
      "status": "ok",
      "recipe": []
    },
    {
      "item": "KETO PROTEIN",
      "category": "VEGAN PROTEINS SMOOTHIES",
      "description": "Avocado, Strawberries, Peanut Butter*, Choc Vegan Protein, erythritol",
      "sellPrice": 8.0,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 37.0,
      "totalFoodCost": null,
      "totalSales": 296.0,
      "contributionMargin": null,
      "popularityCategory": "Low",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Avocado",
          "unit": "1nr",
          "amountPerPortion": 1.0,
          "costPerPortion": 2.0,
          "note": "30gr"
        },
        {
          "type": "Part",
          "ingredient": "Strawberries",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 13.16,
          "note": "20gr"
        },
        {
          "type": "Part",
          "ingredient": "Peanut Butter",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "40g"
        },
        {
          "type": "Part",
          "ingredient": "Choc Vegan Protein",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "10gr"
        },
        {
          "type": "Part",
          "ingredient": "Erythritol",
          "unit": "500gr",
          "amountPerPortion": 1.0,
          "costPerPortion": 10.99,
          "note": "3gr"
        }
      ]
    },
    {
      "item": "MUSCLE SHAKE 500 ml",
      "category": "VEGAN PROTEINS SMOOTHIES",
      "description": "Almond Mylk, Banana, Vanilla or Choc Vegan Proteins",
      "sellPrice": 7.0,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 68.0,
      "totalFoodCost": null,
      "totalSales": 476.0,
      "contributionMargin": null,
      "popularityCategory": "High",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Almond Milk",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "200ml"
        },
        {
          "type": "Part",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": 1.35,
          "note": "150gr"
        },
        {
          "type": "Part",
          "ingredient": "Vanilla or Choc Vegan Proteins",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "10gr"
        }
      ]
    },
    {
      "item": "RE-BUILD",
      "category": "VEGAN PROTEINS SMOOTHIES",
      "description": "Avocado, Banana, Choc Vegan Proteins, Cacao, Lucuma",
      "sellPrice": 8.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 8.0,
      "unitsSold": 87.0,
      "totalFoodCost": 0.0,
      "totalSales": 696.0,
      "contributionMargin": 696.0,
      "popularityCategory": "High",
      "status": "ok",
      "recipe": [
        {
          "type": "Part",
          "ingredient": "Banana",
          "unit": "Kg",
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "50gr"
        },
        {
          "type": "Part",
          "ingredient": "Choc Vegan Proteins",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "10gr"
        },
        {
          "type": "Part",
          "ingredient": "Cacao",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "5gr"
        },
        {
          "type": "Part",
          "ingredient": "Lucuma",
          "unit": "200gr",
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "3gr"
        },
        {
          "type": "Part",
          "ingredient": "Avocado",
          "unit": "1nr",
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "30gr"
        }
      ]
    },
    {
      "item": "Acqua Naturale, 500 ml",
      "category": "DRINKS, ACQUA DI COCCO E ACQUA",
      "description": "",
      "sellPrice": 1.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 1.0,
      "unitsSold": 80.0,
      "totalFoodCost": 0.0,
      "totalSales": 80.0,
      "contributionMargin": 80.0,
      "popularityCategory": "High",
      "status": "ok",
      "recipe": [
        {
          "type": "Full",
          "ingredient": "Acqua Naturale, 500 ml",
          "unit": "#",
          "amountPerPortion": 1.0,
          "costPerPortion": 0.0,
          "note": "#N/A"
        }
      ]
    },
    {
      "item": "Acqua Frizzante 500 ml",
      "category": "DRINKS, ACQUA DI COCCO E ACQUA",
      "description": "",
      "sellPrice": 1.0,
      "unitFoodCost": 0.0,
      "foodCostPct": 0.0,
      "unitProfit": 1.0,
      "unitsSold": 81.0,
      "totalFoodCost": 0.0,
      "totalSales": 81.0,
      "contributionMargin": 81.0,
      "popularityCategory": "High",
      "status": "ok",
      "recipe": [
        {
          "type": "Full",
          "ingredient": "Acqua Frizzante 500 ml",
          "unit": "#",
          "amountPerPortion": 1.0,
          "costPerPortion": 0.0,
          "note": "#N/A"
        }
      ]
    },
    {
      "item": "Acqua di Cocco Bio 500 ml",
      "category": "DRINKS, ACQUA DI COCCO E ACQUA",
      "description": "L’Acqua di Cocco è un sostegno naturale alle attività di tutti i giorni poiché fornisce un apporto di sali minerali essenziali per il nostro organismo: potassio, magnesio, calcio, fosforo e sodio.",
      "sellPrice": 4.5,
      "unitFoodCost": null,
      "foodCostPct": null,
      "unitProfit": 0.0,
      "unitsSold": 73.0,
      "totalFoodCost": null,
      "totalSales": 328.5,
      "contributionMargin": null,
      "popularityCategory": "High",
      "status": "missing_cost",
      "recipe": [
        {
          "type": "Full",
          "ingredient": "L’Acqua di Cocc",
          "unit": null,
          "amountPerPortion": 1.0,
          "costPerPortion": null,
          "note": "#N/A"
        }
      ]
    }
  ]
};
