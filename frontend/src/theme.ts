import { createTheme, defaultCssVariablesResolver, type CSSVariablesResolver } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: { light: 8, dark: 8 },
});

export const cssVariablesResolver: CSSVariablesResolver = (currentTheme) => {
  const variables = defaultCssVariablesResolver(currentTheme);

  return {
    ...variables,
    light: {
      ...variables.light,
      '--mantine-color-dimmed': 'var(--mantine-color-gray-7)',
    },
  };
};
