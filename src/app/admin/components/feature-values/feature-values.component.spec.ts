import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureValuesComponent } from './feature-values.component';

describe('FeatureValuesComponent', () => {
  let component: FeatureValuesComponent;
  let fixture: ComponentFixture<FeatureValuesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FeatureValuesComponent]
    });
    fixture = TestBed.createComponent(FeatureValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
