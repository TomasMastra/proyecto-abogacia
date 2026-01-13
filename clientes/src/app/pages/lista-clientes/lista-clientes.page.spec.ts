import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaClientesPage } from './lista-clientes.page';

describe('ListaClientesPage', () => {
  let component: ListaClientesPage;
  let fixture: ComponentFixture<ListaClientesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaClientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
