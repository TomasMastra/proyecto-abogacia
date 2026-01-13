import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JuzgadosPage } from './juzgados.page';

describe('JuzgadosPage', () => {
  let component: JuzgadosPage;
  let fixture: ComponentFixture<JuzgadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(JuzgadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
