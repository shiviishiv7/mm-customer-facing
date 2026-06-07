import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {

  title = 'Are you sure?';
  description = 'Do you really want to perform this action?'

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      if (this.data['title']) {
        this.title = data.title;
      }
      if (this.data['description']) {
        this.description = data.description;
      }
    }

  }

  onConfirm(): void {
    this.dialogRef.close({'status': true}); // Close dialog with 'Yes' response
  }

  onCancel(): void {
    this.dialogRef.close({'status': false}); // Close dialog with 'No' response
  }
}
