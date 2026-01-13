import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DialogJuzgadoModificarComponent } from './dialog-juzgado-modificar.component';

describe('DialogJuzgadoModificarComponent', () => {
  let component: DialogJuzgadoModificarComponent;
  let fixture: ComponentFixture<DialogJuzgadoModificarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DialogJuzgadoModificarComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DialogJuzgadoModificarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
