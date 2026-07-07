import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbogadosPresentadosPage } from './abogados-presentados.page';

describe('AbogadosPresentadosPage', () => {
  let component: AbogadosPresentadosPage;
  let fixture: ComponentFixture<AbogadosPresentadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AbogadosPresentadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
