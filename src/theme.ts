import { createTheme, type CSSVariablesResolver, type MantineColorsTuple } from "@mantine/core";

// Brand navy: #1B3668 (banner in BBDB logo)
const brandNavy: MantineColorsTuple = [
  "#e8eef7",
  "#c5d2e9",
  "#9ab0d6",
  "#6e8ec2",
  "#4a70b0",
  "#2d579e",
  "#1b3668",
  "#162c58",
  "#112149",
  "#0d1638",
];

// Brand red: #CC2027 (BEANTOWN BABY text in logo)
const brandRed: MantineColorsTuple = [
  "#fde9ea",
  "#f9bec0",
  "#f48e92",
  "#ee5e65",
  "#e83540",
  "#d42029",
  "#cc2027",
  "#a91b22",
  "#87151a",
  "#650f13",
];

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: 6,
  colors: {
    brand: brandNavy,
    brandRed: brandRed,
  },
  // fontFamily: "var(--font-poppins), sans-serif",
  headings: { fontFamily: "var(--font-poppins), sans-serif" },
  defaultRadius: "md",
  components: {
    Button: {
      styles: {
        root: {
          '&[dataVariant="default"]': {
            borderColor: brandNavy[6],
            color: brandNavy[6],
          },
        },
      },
    },
    Modal: {
      defaultProps: {
        radius: "md",
        size: "75%",
        padding: 32,
      },
      styles: {
        title: {
          fontWeight: 800,
          fontSize: 32,
        },
      },
    },
    Mark: {
      defaultProps: {
        bg: "none",
        c: "brand",
      },
    },
  },
});

export const cssVariablesResolver: CSSVariablesResolver = (t) => ({
  variables: {
    "--color-brand": t.colors.brand[6],
    "--color-brand-dark": t.colors.brand[8],
    "--color-brand-light": t.colors.brand[1],
    "--color-brand-red": t.colors.brandRed[6],
    "--color-brand-red-light": t.colors.brandRed[1],
    // Semantic text colors — hand-tuned muted tones derived from brand navy
    "--color-text-heading": "#14324e",
    "--color-text-muted": "#4c647b",
    "--color-text-subtle": "#5f7286",
    "--color-text-accent": "#35658f",
    "--color-text-secondary": "#667085",
  },
  light: {},
  dark: {},
});
