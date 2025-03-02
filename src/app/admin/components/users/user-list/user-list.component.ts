import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { User } from 'src/app/contracts/user/user';
import { AuthorizeUserDialogComponent } from 'src/app/dialogs/authorize-user-dialog/authorize-user-dialog.component';
import { DialogService } from 'src/app/services/common/dialog.service';
import { UserService } from 'src/app/services/common/models/user.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { DeleteDirectiveComponent } from 'src/app/directives/admin/delete-directive/delete-directive.component';
import { DynamicQuery, Filter } from 'src/app/contracts/dynamic-query';
import { UserFilterByDynamic } from 'src/app/contracts/user/userFilterByDynamic';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { TokenService } from 'src/app/services/common/token.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    ReactiveFormsModule,
    DeleteDirectiveComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss', '../../../../../styles.scss']
})
export class UserListComponent extends BaseComponent implements OnInit {
  pageRequest: PageRequest = { pageIndex: 0, pageSize: 10 };
  listUser: GetListResponse<User> = { index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false, items: [] };
  pagedUsers: User[] = [];
  selectedUsers: User[] = [];
  currentPageNo: number = 1;
  totalItems: number = 0;
  pageSize: number = 10;
  count: number = 0;
  pages: number = 0;
  pageList: number[] = [];

  displayedColumns: string[] = ['No', 'userName', 'email', 'nameSurname', 'twoFactorEnabled', 'role', 'actions', 'delete'];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  searchForm: FormGroup;
  private searchCache: User[] = []; // Arama sonuçları önbelleği
  private currentSearchTerm: string = ''; // Mevcut arama terimi


  constructor(
    private userService: UserService,
    private toastrService: CustomToastrService,
    private dialogService: DialogService,
    private tokenService: TokenService,
    spinner: SpinnerService,
    private fb: FormBuilder
  ) {
    super(spinner);
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.searchForm.get('searchTerm')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value.length >= 3) {
        this.searchUsers(value);
      } else if (value.length === 0) {
        this.getAllUsers();
        this.searchCache = []; // Önbelleği temizle
        this.currentSearchTerm = '';
      }
    });
  }

  async ngOnInit() {
    await this.getAllUsers();
  }

  async getAllUsers() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    const data : GetListResponse<User> = await this.userService.getAllUsers(
      { pageIndex: this.currentPageNo - 1, pageSize: this.pageSize },
      () => {},
      (error) => {
        this.toastrService.message("Kullanıcılar getirilirken bir hata oluştu", 'Hata', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    );
    this.listUser = data;
    this.pagedUsers = data.items;
    this.count = data.count;
    this.pages = Math.ceil(this.count / this.pageSize);
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }

  async searchUsers(searchTerm: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    if(searchTerm.startsWith(this.currentSearchTerm) && this.searchCache.length > 0) {
      this.pagedUsers = this.searchCache.filter(user => 
        this.userMatchesSearchTerm(user, searchTerm)
      );
      this.count = this.pagedUsers.length;
      this.pages = Math.ceil(this.count / this.pageSize);
      this.currentPageNo = 1;
    }else {
      const filters: Filter[] = this.buildFilters(searchTerm);

      const dynamicQuery: DynamicQuery = {
        sort: [{ field: "nameSurname", dir: "asc" }],
        filter: filters.length > 0 ? {
          logic: "and",
          filters: filters
        } : undefined
      };

      const pageRequest: PageRequest = { pageIndex: 0, pageSize: this.pageSize };

      await this.userService.getUserByDynamicQuery(dynamicQuery,pageRequest).then((response) => {
        this.pagedUsers = response.items;
        this.count = response.count;
        this.pages = response.pages;
        this.currentPageNo = 1;

        this.searchCache = response.items;
        this.currentSearchTerm = searchTerm;
      }).catch((error) => {
        this.toastrService.message("Kullanıcılar getirilirken bir hata oluştu", 'Hata', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
          });
    }).finally(() => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }
  }

  private userMatchesSearchTerm(user: User, searchTerm: string): boolean {
    const terms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
    const nameSurname = user.nameSurname.toLowerCase();
    const email = user.email.toLowerCase();
    const userName = user.userName.toLowerCase();
    return terms.every(term => nameSurname.includes(term) || email.includes(term) || userName.includes(term));
  }

  private buildFilters(searchTerm: string): Filter[] {
    const terms = searchTerm.split(' ').filter(term => term.length > 0);
  
    const nameSurname = UserFilterByDynamic.NameSurname;
    const email = UserFilterByDynamic.Email;
    const userName = UserFilterByDynamic.UserName;
    const filters: Filter[] = terms.map(term => ({
      field: nameSurname,
      operator: "contains",
      value: searchTerm,
      logic: "or",
      filters: [
        {
          field: email,
          operator: "contains",
          value: searchTerm,
          logic: "or",
          filters: [
            {
              field: userName,
              operator: "contains",
              value: searchTerm,
            }
          ],
        },
      ],
    }));
  
    return filters;
  }

  onPageChange(event: any) {
    this.pageRequest.pageIndex = event.pageIndex;
    this.pageRequest.pageSize = event.pageSize;
    this.currentPageNo = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getAllUsers();
  }

  assignRole(id: string) {
    this.dialogService.openDialog({
      componentType: AuthorizeUserDialogComponent,
      data: id,
    });
  }

  removeUserFromList(userId: string) {
    this.pagedUsers = this.pagedUsers.filter(user => user.id !== userId);
    this.count--;
    this.pages = Math.ceil(this.count / this.pageSize);

    if (this.pagedUsers.length === 0 && this.currentPageNo > 1) {
      this.currentPageNo--;
      this.getAllUsers();
    }
  }
  async revokeUserTokens(userId: string, userName: string) {
    if (confirm(`${userName} kullanıcısının tüm oturumlarını sonlandırmak istediğinize emin misiniz?`)) {
      this.showSpinner(SpinnerType.BallSpinClockwise);
      
      try {
        const success = await this.tokenService.revokeUserTokens(userId);
        
        if (success) {
          this.toastrService.message(
            `${userName} kullanıcısının tüm oturumları başarıyla sonlandırıldı.`, 
            'Başarılı', 
            {
              toastrMessageType: ToastrMessageType.Success,
              position: ToastrPosition.TopRight
            }
          );
        } else {
          throw new Error('İşlem başarısız oldu');
        }
      } catch (error) {
        console.error('Token iptal hatası:', error);
        
        this.toastrService.message(
          `${userName} kullanıcısının oturumları sonlandırılırken bir hata oluştu.`, 
          'Hata', 
          {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
          }
        );
      } finally {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      }
    }
  }
}