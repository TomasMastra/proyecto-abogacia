import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaMediacionesPage } from './lista-mediaciones.page';

describe('ListaMediacionesPage', () => {
  let component: ListaMediacionesPage;
  let fixture: ComponentFixture<ListaMediacionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListaMediacionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
