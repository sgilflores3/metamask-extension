import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  SnapCaveatType,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/rpc-methods';
import classnames from 'classnames';
import Button from '../../../../components/ui/button';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Color,
  FLEX_WRAP,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import SnapAuthorshipExpanded from '../../../../components/app/snaps/snap-authorship-expanded';
import Box from '../../../../components/ui/box';
import SnapRemoveWarning from '../../../../components/app/snaps/snap-remove-warning';
import KeyringSnapRemovalWarning from '../../../../components/app/snaps/keyring-snap-removal-warning';
import KeyringSnapRemovalResult from '../../../../components/app/snaps/keyring-snap-removal-result';
import ConnectedSitesList from '../../../../components/app/connected-sites-list';

import { SNAPS_LIST_ROUTE } from '../../../../helpers/constants/routes';
import {
  removeSnap,
  removePermissionsFor,
  updateCaveat,
} from '../../../../store/actions';
import {
  getSnaps,
  getSubjectsWithSnapPermission,
  getPermissions,
  getPermissionSubjects,
  getTargetSubjectMetadata,
  getInternalAccounts,
} from '../../../../selectors';
import { getSnapName } from '../../../../helpers/utils/util';
import { Text } from '../../../../components/component-library';
import SnapPermissionsList from '../../../../components/app/snaps/snap-permissions-list';
import { SnapDelineator } from '../../../../components/app/snaps/snap-delineator';
import { DelineatorType } from '../../../../helpers/constants/snaps';

const KeyringSnapRemovalResultStatus = {
  Success: 'success',
  Failed: 'failed',
  None: 'none',
};

function ViewSnap() {
  const t = useI18nContext();
  const history = useHistory();
  const location = useLocation();
  const descriptionRef = useRef(null);
  const { pathname } = location;
  // The snap ID is in URI-encoded form in the last path segment of the URL.
  const decodedSnapId = decodeURIComponent(pathname.match(/[^/]+$/u)[0]);
  const snaps = useSelector(getSnaps);
  const snap = Object.entries(snaps)
    .map(([_, snapState]) => snapState)
    .find((snapState) => snapState.id === decodedSnapId);
  const internalAccounts = useSelector(getInternalAccounts);

  const [isShowingRemoveWarning, setIsShowingRemoveWarning] = useState(false);
  const [removeKeyringSnapResult, setRemoveKeyringSnapResult] = useState({
    result: KeyringSnapRemovalResultStatus.None,
  });
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (!snap) {
      history.push(SNAPS_LIST_ROUTE);
    }
  }, [history, snap]);

  useEffect(() => {
    setIsOverflowing(
      descriptionRef.current &&
        descriptionRef.current.offsetHeight <
          descriptionRef.current.scrollHeight,
    );
  }, [descriptionRef]);

  const connectedSubjects = useSelector((state) =>
    getSubjectsWithSnapPermission(state, snap?.id),
  );
  const permissions = useSelector(
    (state) => snap && getPermissions(state, snap.id),
  );
  const subjects = useSelector((state) => getPermissionSubjects(state));
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snap?.id),
  );
  const isKeyringSnap = Boolean(
    subjects[snap?.id]?.permissions?.snap_manageAccounts,
  );
  const keyringAccounts = internalAccounts.filter(
    (internalAccount) =>
      isKeyringSnap &&
      internalAccount.metadata.keyring.type === 'Snap Keyring' &&
      internalAccount.metadata.snap.id === snap?.id,
  );
  const dispatch = useDispatch();

  const onDisconnect = (connectedOrigin, snapId) => {
    const caveatValue =
      subjects[connectedOrigin].permissions[WALLET_SNAP_PERMISSION_KEY]
        .caveats[0].value;
    const newCaveatValue = { ...caveatValue };
    delete newCaveatValue[snapId];
    if (Object.keys(newCaveatValue).length > 0) {
      dispatch(
        updateCaveat(
          connectedOrigin,
          WALLET_SNAP_PERMISSION_KEY,
          SnapCaveatType.SnapIds,
          newCaveatValue,
        ),
      );
    } else {
      dispatch(
        removePermissionsFor({
          [connectedOrigin]: [WALLET_SNAP_PERMISSION_KEY],
        }),
      );
    }
  };

  if (!snap) {
    return null;
  }

  const snapName = getSnapName(snap.id, targetSubjectMetadata);

  const shouldDisplayMoreButton = isOverflowing && !isDescriptionOpen;
  const handleMoreClick = () => {
    setIsDescriptionOpen(true);
  };

  return (
    <Box
      className="view-snap"
      paddingBottom={[4, 8]}
      paddingTop={[4, 8]}
      paddingLeft={4}
      paddingRight={4}
    >
      <SnapAuthorshipExpanded snapId={snap.id} snap={snap} />
      <Box className="view-snap__description" marginTop={[4, 7]}>
        <SnapDelineator type={DelineatorType.Description} snapName={snapName}>
          <Box
            className={classnames('view-snap__description__wrapper', {
              open: isDescriptionOpen,
            })}
            ref={descriptionRef}
          >
            <Text>{snap?.manifest.description}</Text>
            {shouldDisplayMoreButton && (
              <Button
                className="view-snap__description__more-button"
                type="link"
                onClick={handleMoreClick}
              >
                <Text color={Color.infoDefault}>{t('more')}</Text>
              </Button>
            )}
          </Box>
        </SnapDelineator>
      </Box>
      <Box className="view-snap__permissions" marginTop={12}>
        <Text variant={TextVariant.bodyLgMedium}>{t('permissions')}</Text>
        <SnapPermissionsList
          snapId={decodedSnapId}
          permissions={permissions ?? {}}
          targetSubjectMetadata={targetSubjectMetadata}
          showOptions
        />
      </Box>
      <Box className="view-snap__connected-sites" marginTop={12}>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={2}>
          {t('connectedSites')}
        </Text>
        <ConnectedSitesList
          connectedSubjects={connectedSubjects}
          onDisconnect={(origin) => {
            onDisconnect(origin, snap.id);
          }}
        />
      </Box>
      <Box className="view-snap__remove" marginTop={12}>
        <Text variant={TextVariant.bodyLgMedium} color={TextColor.textDefault}>
          {t('removeSnap')}
        </Text>
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {t('removeSnapDescription')}
        </Text>
        <Box marginTop={4}>
          <Button
            className="view-snap__remove-button"
            type="danger"
            onClick={() => setIsShowingRemoveWarning(true)}
          >
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.errorDefault}
              flexWrap={FLEX_WRAP.NO_WRAP}
              ellipsis
              style={{ overflow: 'hidden' }}
            >
              {`${t('remove')} ${snapName}`}
            </Text>
          </Button>
          <SnapRemoveWarning
            isOpen={isShowingRemoveWarning && !isKeyringSnap}
            keyringAccounts={keyringAccounts}
            snapUrl={snap.url}
            onCancel={() => setIsShowingRemoveWarning(false)}
            onSubmit={async () => {
              await dispatch(removeSnap(snap.id));
            }}
            snapName={snapName}
          />
          <KeyringSnapRemovalWarning
            snap={snap}
            keyringAccounts={keyringAccounts}
            snapUrl={snap.url}
            onCancel={() => setIsShowingRemoveWarning(false)}
            onClose={() => setIsShowingRemoveWarning(false)}
            onBack={() => setIsShowingRemoveWarning(false)}
            onSubmit={async () => {
              try {
                await dispatch(removeSnap(snap.id));
                setRemoveKeyringSnapResult({
                  result: KeyringSnapRemovalResultStatus.Success,
                });
              } catch (e) {
                setRemoveKeyringSnapResult({
                  result: KeyringSnapRemovalResultStatus.Failed,
                });
              } finally {
                setIsShowingRemoveWarning(false);
              }
            }}
            isOpen={isShowingRemoveWarning && isKeyringSnap}
          />
          <KeyringSnapRemovalResult
            snapName={snap.manifest.proposedName}
            result={removeKeyringSnapResult.result}
            isOpen={removeKeyringSnapResult.result !== 'none'}
            onClose={() =>
              setRemoveKeyringSnapResult({
                result: KeyringSnapRemovalResultStatus.None,
              })
            }
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ViewSnap;