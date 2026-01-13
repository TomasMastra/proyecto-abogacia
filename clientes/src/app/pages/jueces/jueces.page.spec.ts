import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JuecesPage } from './jueces.page';

describe('JuecesPage', () => {
  let component: JuecesPage;
  let fixture: ComponentFixture<JuecesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(JuecesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
