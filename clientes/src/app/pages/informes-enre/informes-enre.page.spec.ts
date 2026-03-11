import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InformesEnrePage } from './informes-enre.page';

describe('InformesEnrePage', () => {
  let component: InformesEnrePage;
  let fixture: ComponentFixture<InformesEnrePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InformesEnrePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
