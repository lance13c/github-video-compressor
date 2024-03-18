import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa'
import { INSTALL_STATUS, InstallStatus } from '~/src/shared/constants'

interface Props {
  status: InstallStatus
}

const InstallStatusIcon: React.FC<Props> = ({ status }) => {
  switch (status) {
    case INSTALL_STATUS.INSTALLING:
      return <FaSpinner className="animate-spin" />
    case INSTALL_STATUS.INSTALLED:
      return <FaCheckCircle className="text-green-500" />
    case INSTALL_STATUS.FAILED:
      return <FaExclamationCircle className="text-red-500" />
    default:
      return null
  }
}

export default InstallStatusIcon
