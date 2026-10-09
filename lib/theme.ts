export type Theme = 'light' | 'dark';

const KEY = 'pagepluck:theme';

/** The only value PagePluck persists: the panel theme. Asset data stays ephemeral. */
export const storedTheme = (): Theme => (localStorage.getItem(KEY) === 'light' ? 'light' : 'dark');

export const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
};
