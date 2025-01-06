import { FlatTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeModule } from '@angular/material/tree';
import { BaseComponent } from 'src/app/base/base/base.component';
import { AuthorizeMenuDialogComponent } from 'src/app/dialogs/authorizeMenuDialogs/authorize-menu-dialog/authorize-menu-dialog.component';
import { DialogService } from 'src/app/services/common/dialog.service';
import { ApplicationService } from 'src/app/services/common/models/application.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';

interface ITreeMenu {
  name?: string,
  actions?: ITreeMenu[],
  code?: string,
  menuName?: string
}

interface ExampleFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'app-authorize-menu',
  standalone: true,
  imports: [MatTreeModule, MatIconModule, MatButtonModule, CommonModule],
  templateUrl: './authorize-menu.component.html',
  styleUrl: './authorize-menu.component.scss'
})
export class AuthorizeMenuComponent extends BaseComponent implements OnInit {

  constructor(spinner: SpinnerService, private applicationService: ApplicationService, private dialogService: DialogService) {
    super(spinner)
  }

  async ngOnInit() {
    this.dataSource.data = await (await this.applicationService.getAuthorizeDefinitionEndpoints())
      .map(m => {
        const treeMenu: ITreeMenu = {
          name: m.name,
          actions: m.actions.map(a => {
            const _treeMenu: ITreeMenu = {
              name: a.definition,
              code: a.code,
              menuName: m.name
            }
            return _treeMenu;
          })
        };
        return treeMenu;
      });
  }

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    (menu: ITreeMenu, level: number) => {
      return {
        expandable: menu.actions?.length > 0,
        name: menu.name,
        level: level,
        code: menu.code,
        menuName: menu.menuName
      };
    },
    menu => menu.level,
    menu => menu.expandable,
    menu => menu.actions
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);


  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  assignRole(code: string, name: string, menuName: string) {
    this.dialogService.openDialog({
      componentType: AuthorizeMenuDialogComponent,
      data: { code: code, name: name, menuName: menuName },
      options: {
        width: "500px",
        height: "750px"
      },
      afterClosed: () => {

      }
    });
  }
}