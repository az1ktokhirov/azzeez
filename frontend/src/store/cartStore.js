import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  items: [],

  addItem: (product, input) => {
    const items = get().items;
    const existingIndex = items.findIndex(
      (item) => item.product.id === product.id,
    );

    if (existingIndex >= 0) {
      // Update existing item
      const newItems = [...items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        input: input,
      };
      set({ items: newItems });
    } else {
      // Add new item
      set({ items: [...items, { product, input }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.product.id !== productId) });
  },

  updateItemInput: (productId, input) => {
    const items = get().items;
    const index = items.findIndex((item) => item.product.id === productId);

    if (index >= 0) {
      const newItems = [...items];
      newItems[index].input = input;
      set({ items: newItems });
    }
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    const items = get().items;
    return items.reduce((total, item) => {
      const { product, input } = item;

      if (product.type === "piece") {
        return total + input * parseFloat(product.sale_price);
      } else {
        return total + input; // For kg_price, input is already the money amount
      }
    }, 0);
  },
}));
