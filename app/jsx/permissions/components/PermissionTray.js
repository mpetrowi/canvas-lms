/*
 * Copyright (C) 2018 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */
import I18n from 'i18n!permissions_role_tray'
import {connect} from 'react-redux'
import {arrayOf, bool, func, string} from 'prop-types'
import React from 'react'
import {flatten} from 'lodash'

import {Button} from '@instructure/ui-buttons'
import {View} from '@instructure/ui-view'
import {Heading} from '@instructure/ui-heading'
import {IconXSolid} from '@instructure/ui-icons'
import {Tray} from '@instructure/ui-tray'

import actions from '../actions'
import RoleTrayTable from './RoleTrayTable'
import RoleTrayTableRow from './RoleTrayTableRow'
import permissionPropTypes, {COURSE} from '../propTypes'

import DetailsToggle from './DetailsToggle'
import {
  PERMISSION_DETAILS_COURSE_TEMPLATES,
  PERMISSION_DETAILS_ACCOUNT_TEMPLATES,
  PERMISSION_DETAIL_SECTIONS
} from '../templates'

function renderPermissionDetailToggles(tab, permissionName) {
  return PERMISSION_DETAIL_SECTIONS.map(PDS => (
    <DetailsToggle
      key={PDS.key}
      title={PDS.title()}
      detailItems={
        tab === COURSE
          ? PERMISSION_DETAILS_COURSE_TEMPLATES[PDS.key][permissionName] || []
          : PERMISSION_DETAILS_ACCOUNT_TEMPLATES[PDS.key][permissionName] || []
      }
    />
  ))
}

// TODO don't pass in label if we are passing in permission
export default function PermissionTray(props) {
  return (
    <Tray
      label={props.label}
      open={props.open}
      onDismiss={props.hideTray}
      size="small"
      placement="end"
    >
      <Button
        id="close"
        variant="icon"
        size="small"
        margin="small 0 0 xx-small"
        onClick={props.hideTray}
      >
        <IconXSolid title={I18n.t('Close')} />
      </Button>

      <View as="div" padding="small small x-large small">
        <Heading level="h3" as="h2" margin="0 0 medium 0">
          {props.label}
        </Heading>
        {renderPermissionDetailToggles(props.tab, props.permissionName)}
        {props.assignedRoles.length !== 0 && (
          <RoleTrayTable title={I18n.t('Assigned Roles')}>
            {props.assignedRoles.map(role => (
              <RoleTrayTableRow
                key={role.label}
                title={role.label}
                description=""
                expandable={false}
                permissionName={props.permissionName}
                permissionLabel={props.label}
                permission={role.permissions[props.permissionName]}
                role={role}
              />
            ))}
          </RoleTrayTable>
        )}
        {props.unassignedRoles.length !== 0 && (
          <RoleTrayTable title={I18n.t('Unassigned Roles')}>
            {props.unassignedRoles.map(role => (
              <RoleTrayTableRow
                key={role.label}
                title={role.label}
                description=""
                expandable={false}
                permissionName={props.permissionName}
                permissionLabel={props.label}
                permission={role.permissions[props.permissionName]}
                role={role}
              />
            ))}
          </RoleTrayTable>
        )}
      </View>
    </Tray>
  )
}

PermissionTray.propTypes = {
  assignedRoles: arrayOf(permissionPropTypes.role).isRequired,
  hideTray: func.isRequired,
  label: string.isRequired,
  open: bool.isRequired,
  unassignedRoles: arrayOf(permissionPropTypes.role).isRequired,
  permissionName: string.isRequired,
  tab: string.isRequired
}

function mapStateToProps(state, ownProps) {
  function findPermission(name) {
    // First try the primary permissions (might be a group)
    const perm = state.permissions.find(
      p => p.permission_name === name && p.contextType === ownProps.tab
    )
    if (perm) return perm

    // If that didn't work, try granular permissions buried inside groups
    const groupPerms = flatten(
      state.permissions
        .filter(p => p.contextType === ownProps.tab)
        .map(p => p.granular_permissions)
        .filter(p => typeof p !== 'undefined')
    )
    return groupPerms.find(p => p.permission_name === name)
  }

  if (state.activePermissionTray === null) {
    const stateProps = {
      assignedRoles: [],
      label: '',
      open: false,
      unassignedRoles: [],
      tab: ownProps.tab || COURSE
    }
    return {...stateProps, ...ownProps}
  }

  const permission = findPermission(state.activePermissionTray.permissionName)
  const permissionName = permission.permission_name
  const displayedRoles = state.roles.filter(r => r.displayed)

  const stateProps = {
    assignedRoles: displayedRoles.filter(r => r.permissions[permissionName].enabled),
    permissionName,
    label: permission.label,
    open: true,
    unassignedRoles: displayedRoles.filter(r => !r.permissions[permissionName].enabled),
    tab: ownProps.tab || COURSE
  }
  return {...ownProps, ...stateProps}
}

const mapDispatchToProps = {
  hideTray: actions.hideAllTrays
}

export const ConnectedPermissionTray = connect(mapStateToProps, mapDispatchToProps)(PermissionTray)
