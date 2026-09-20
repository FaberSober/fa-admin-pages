import { BgColorsOutlined, LayoutOutlined, MoonOutlined, ReloadOutlined } from '@ant-design/icons';
import { InputColor, ThemeLayoutContext } from '@fa/ui';
import { Button, Drawer, Switch } from 'antd';
import { useContext, useId } from 'react';
import { useIntl } from 'react-intl';
import { SITE_INFO } from '@/configs';
import MenuLayoutContext from '../../layout/menu/context/MenuLayoutContext';
import './UserAppearanceSettings.scss';

export interface UserAppearanceSettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function UserAppearanceSettings({ open, onClose }: UserAppearanceSettingsProps) {
  const intl = useIntl();
  const settingsId = useId();
  const { colorPrimary, setColorPrimary, themeDark, setThemeDark } = useContext(ThemeLayoutContext);
  const { showTabs, setShowTabs } = useContext(MenuLayoutContext);

  function handleReset() {
    setColorPrimary(SITE_INFO.PRIMARY_COLOR);
    setThemeDark(SITE_INFO.THEME === 'dark');
    setShowTabs(SITE_INFO.SHOW_TABS ?? true);
  }

  return (
    <Drawer
      title={intl.formatMessage({ id: 'menu.account.settings' })}
      placement="right"
      width={320}
      open={open}
      onClose={onClose}
      footer={
        <Button block icon={<ReloadOutlined />} onClick={handleReset}>
          {intl.formatMessage({ id: 'settings.reset' })}
        </Button>
      }
    >
      <div className="fa-user-appearance-settings">
        <section className="fa-user-appearance-settings__section" aria-labelledby={`${settingsId}-theme`}>
          <h3 id={`${settingsId}-theme`} className="fa-user-appearance-settings__section-title">
            {intl.formatMessage({ id: 'settings.appearance' })}
          </h3>
          <div className="fa-user-appearance-settings__row">
            <div className="fa-user-appearance-settings__row-info">
              <MoonOutlined className="fa-user-appearance-settings__row-icon" aria-hidden="true" />
              <div>
                <div className="fa-user-appearance-settings__row-label">{intl.formatMessage({ id: 'settings.theme.dark' })}</div>
                <div className="fa-user-appearance-settings__row-description">{intl.formatMessage({ id: 'settings.theme.dark.description' })}</div>
              </div>
            </div>
            <Switch checked={themeDark} onChange={setThemeDark} />
          </div>
          <div className="fa-user-appearance-settings__row">
            <div className="fa-user-appearance-settings__row-info">
              <BgColorsOutlined className="fa-user-appearance-settings__row-icon" aria-hidden="true" />
              <div>
                <div className="fa-user-appearance-settings__row-label">{intl.formatMessage({ id: 'settings.theme.primary' })}</div>
                <div className="fa-user-appearance-settings__row-description">{intl.formatMessage({ id: 'settings.theme.primary.description' })}</div>
              </div>
            </div>
            <InputColor value={colorPrimary} onChange={setColorPrimary} />
          </div>
        </section>

        <section className="fa-user-appearance-settings__section" aria-labelledby={`${settingsId}-layout`}>
          <h3 id={`${settingsId}-layout`} className="fa-user-appearance-settings__section-title">
            {intl.formatMessage({ id: 'settings.layout' })}
          </h3>
          <div className="fa-user-appearance-settings__row">
            <div className="fa-user-appearance-settings__row-info">
              <LayoutOutlined className="fa-user-appearance-settings__row-icon" aria-hidden="true" />
              <div>
                <div className="fa-user-appearance-settings__row-label">{intl.formatMessage({ id: 'settings.layout.tabs' })}</div>
                <div className="fa-user-appearance-settings__row-description">{intl.formatMessage({ id: 'settings.layout.tabs.description' })}</div>
              </div>
            </div>
            <Switch checked={showTabs ?? true} onChange={setShowTabs} />
          </div>
        </section>
      </div>
    </Drawer>
  );
}
