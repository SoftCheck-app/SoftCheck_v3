import Link from 'next/link';
import classNames from 'classnames';

export interface MenuItem {
  name: string;
  href: string;
  icon?: any;
  active?: boolean;
  items?: Omit<MenuItem, 'icon' | 'items'>[];
  className?: string;
}

export interface NavigationProps {
  activePathname: string | null;
}

interface NavigationItemsProps {
  menus: MenuItem[];
}

interface NavigationItemProps {
  menu: MenuItem;
  className?: string;
}

const NavigationItems = ({ menus }: NavigationItemsProps) => {
  return (
    <ul role="list" className="flex flex-1 flex-col gap-1">
      {menus.map((menu) => (
        <li key={menu.name}>
          <NavigationItem menu={menu} />
          {menu.items && (
            <ul className="flex flex-col gap-1 mt-1">
              {menu.items.map((subitem) => (
                <li key={subitem.name}>
                  <NavigationItem menu={subitem} className="pl-9" />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
};

const NavigationItem = ({ menu, className }: NavigationItemProps) => {
  return (
    <Link
      href={menu.href}
      className={`${
        menu.active 
          ? 'bg-gray-800/30 text-blue-400' 
          : 'text-gray-400 hover:bg-gray-800/30'
      } mt-2 px-3 py-2 rounded-md flex items-center cursor-pointer text-sm ${className || ''}`}
    >
      {menu.icon && (
        <menu.icon
          className={classNames({
            'h-5 w-5 shrink-0 mr-2': true,
            'text-blue-400': menu.active,
            'text-gray-400': !menu.active,
          })}
          aria-hidden="true"
        />
      )}
      {menu.name}
    </Link>
  );
};

export default NavigationItems;
