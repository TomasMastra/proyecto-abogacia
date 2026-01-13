import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CobranzasPage } from './cobranzas.page';

describe('CobranzasPage', () => {
  let component: CobranzasPage;
  let fixture: ComponentFixture<CobranzasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CobranzasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
