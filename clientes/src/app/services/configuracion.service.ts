import { Injectable } from '@angular/core';

export type FontSizeOption = 'chica' | 'mediana' | 'grande' | 'muy-grande';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {

  private sizes: Record<FontSizeOption, number> = {
    chica: 18,
    mediana: 22,
    grande: 25,
    'muy-grande': 30
  };

  apply(size: FontSizeOption) {
    const px = this.sizes[size];
    document.documentElement.style.setProperty('--font-base', `${px}px`);
    localStorage.setItem('fontSize', size);
  }

  getCurrent(): FontSizeOption {
    return (localStorage.getItem('fontSize') as FontSizeOption) || 'mediana';
  }
}