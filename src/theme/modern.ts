import { ThemeFactory, ThemeProduct, CSS_VARIABLES_THEME } from './types';

export class ModernThemeFactory extends ThemeFactory {
  public createTheme(): ThemeProduct {
    return CSS_VARIABLES_THEME;
  }
}
