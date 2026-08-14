import { ThemeFactory, ThemeProduct, CSS_VARIABLES_THEME } from './types';

export class VintageNavyThemeFactory extends ThemeFactory {
  public createTheme(): ThemeProduct {
    return CSS_VARIABLES_THEME;
  }
}
