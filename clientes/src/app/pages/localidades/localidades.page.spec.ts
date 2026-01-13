import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocalidadesPage } from './localidades.page';

describe('LocalidadesPage', () => {
  let component: LocalidadesPage;
  let fixture: ComponentFixture<LocalidadesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalidadesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
