import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="s3-on-dark shrink-0 px-4 py-2 text-xs leading-snug">
            <p>
                Built on open-source projects and provided by San3a Academy to help makers and students process
                fabrication on the machines at Fab Lab Egypt. Provided as is, without warranty. Follow the lab&apos;s
                safety rules and check every toolpath before milling.{' '}
                <Link className="s3-text-link" to="/" state={{ section: 'credits' }}>Credits and licenses</Link>
            </p>
        </footer>
    )
}
