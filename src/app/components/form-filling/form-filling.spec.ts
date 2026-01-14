import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFilling } from './form-filling';

describe('FormFilling', () => {
  let component: FormFilling;
  let fixture: ComponentFixture<FormFilling>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFilling]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormFilling);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
