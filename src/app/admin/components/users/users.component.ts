import { Component, ViewChild } from '@angular/core';
import { UserListComponent } from './user-list/user-list.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [UserListComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {

  @ViewChild(UserListComponent) userListComponent: UserListComponent;
}
