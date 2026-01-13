import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DialogLocalidadModificarComponent } from './dialog-localidad-modificar.component';

describe('DialogLocalidadModificarComponent', () => {
  let component: DialogLocalidadModificarComponent;
  let fixture: ComponentFixture<DialogLocalidadModificarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogLocalidadModificarComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DialogLocalidadModificarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
