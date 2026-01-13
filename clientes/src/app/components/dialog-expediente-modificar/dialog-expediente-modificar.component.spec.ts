import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DialogExpedienteModificarComponent } from './dialog-expediente-modificar.component';

describe('DialogExpedienteModificarComponent', () => {
  let component: DialogExpedienteModificarComponent;
  let fixture: ComponentFixture<DialogExpedienteModificarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogExpedienteModificarComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DialogExpedienteModificarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
