import { useSelector } from 'react-redux';

const useUser = () => {
  const { user, permissions } = useSelector((state) => state.auth);

  const hasPermission = (permission) => {
    return permissions && permissions.includes(permission);
  };

  return { user, permissions, hasPermission };
};

export default useUser;
