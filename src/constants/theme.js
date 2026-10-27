const sharedTokens = {
  colorPrimary: "#176b57",
  colorSuccess: "#2e8b57",
  colorWarning: "#c58a1b",
  colorError: "#c94c4c",
  colorInfo: "#176b57",
  borderRadius: 5,
  controlHeight: 38,
  fontFamily: 'Manrope, "Tiro Bangla", sans-serif',
};

export const lightTheme = {
  token: {
    ...sharedTokens,
    colorBgLayout: "#f4f3ee",
    colorBgContainer: "#ffffff",
    colorBorder: "#deded7",
    colorText: "#1f2933",
    colorTextSecondary: "#667580",
  },
  components: {
    Layout: {
      bodyBg: "#f4f3ee",
      headerBg: "#ffffff",
      siderBg: "#ffffff",
    },
    Menu: {
      itemBg: "transparent",
      itemColor: "#2d3748",
      itemHoverBg: "#f0fdf4",
      itemHoverColor: "#166534",
      itemSelectedBg: "#dbeee7",
      itemSelectedColor: "#124b3d",
      subMenuItemBg: "#fafaf8",
      popupBg: "#ffffff",
      itemBorderRadius: 6,
      itemMarginInline: 8,
      darkItemBg: "#124b3d",
      darkItemColor: "#c5d7d0",
      darkItemHoverBg: "#246454",
      darkItemSelectedBg: "#3a6e61",
      darkItemSelectedColor: "#ffffff",
    },
    Table: {
      headerBg: "#fafaf7",
      headerColor: "#475866",
      rowHoverBg: "#f4f8f5",
    },
    Card: {
      boxShadowTertiary: "0 1px 2px rgba(31, 41, 51, 0.03)",
    },
  },
};

export const darkTheme = {
  algorithm: "dark",
  token: {
    ...sharedTokens,
    colorBgLayout: "#101b18",
    colorBgContainer: "#182722",
    colorBorder: "#2d443b",
    colorText: "#edf4f0",
    colorTextSecondary: "#a9beb5",
  },
  components: {
    Layout: {
      bodyBg: "#101b18",
      headerBg: "#182722",
      siderBg: "#0d382e",
    },
    Menu: {
      darkItemBg: "#0d382e",
      darkItemColor: "#c5d7d0",
      darkItemHoverBg: "#1e5747",
      darkItemHoverColor: "#ffffff",
      darkItemSelectedBg: "#246454",
      darkItemSelectedColor: "#ffffff",
      darkSubMenuItemBg: "#07261f",
      darkPopupBg: "#0d382e",
      itemBorderRadius: 6,
      itemMarginInline: 8,
    },
    Table: {
      headerBg: "#20332c",
      headerColor: "#c5d7d0",
      rowHoverBg: "#213a30",
    },
    Card: {
      boxShadowTertiary: "0 1px 2px rgba(0, 0, 0, 0.18)",
    },
  },
};
