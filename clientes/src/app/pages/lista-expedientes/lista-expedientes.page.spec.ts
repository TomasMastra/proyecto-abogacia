import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaExpedientesPage } from './lista-expedientes.page';

describe('ListaExpedientesPage', () => {
  let component: ListaExpedientesPage;
  let fixture: ComponentFixture<ListaExpedientesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaExpedientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
